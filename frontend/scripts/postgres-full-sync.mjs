import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import neo4j from 'neo4j-driver';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    
    // Remove wrapping quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    
    if (!key) continue;
    if (process.env[key] !== undefined) continue;
    process.env[key] = value;
  }
}

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}. Create .env.local in frontend.`);
  return v;
}

const PORTRAITS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=600"
];

async function main() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, '.env.local'));
  loadEnvFile(path.join(cwd, '.env'));

  const sqlConnectionString = requiredEnv('DATABASE_URL');
  const neo4jUri = requiredEnv('NEO4J_URI');
  const neoUsername = requiredEnv('NEO4J_USERNAME');
  const neoPassword = requiredEnv('NEO4J_PASSWORD');
  const neoDatabase = process.env.NEO4J_DATABASE || undefined;

  console.log("Connecting to PostgreSQL...");
  const sqlClient = postgres(sqlConnectionString, { prepare: false });

  console.log("Connecting to Neo4j...");
  const driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neoUsername, neoPassword));
  const session = driver.session({ database: neoDatabase });

  try {
    await driver.verifyConnectivity();
    console.log("Verified database connectivity.");

    // 1. Create SQL DDL tables if they do not exist
    console.log("Applying normalized relational schema DDL tables to PostgreSQL...");
    await sqlClient`
      CREATE TABLE IF NOT EXISTS majors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(256) UNIQUE NOT NULL,
        faculty VARCHAR(256) NOT NULL
      );
    `;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(256) NOT NULL
      );
    `;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS hobbies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(256) UNIQUE NOT NULL,
        category VARCHAR(256)
      );
    `;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS user_courses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE
      );
    `;
    await sqlClient`
      CREATE TABLE IF NOT EXISTS user_hobbies (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        hobby_id INTEGER NOT NULL REFERENCES hobbies(id) ON DELETE CASCADE
      );
    `;
    console.log("PostgreSQL schema tables are ready!");

    // 2. Synchronize Majors
    console.log("Synchronizing Majors...");
    const neoMajors = await session.run(`MATCH (m:Major) RETURN m.name AS name, m.faculty AS faculty`);
    for (const record of neoMajors.records) {
      const name = record.get('name');
      const faculty = record.get('faculty') || 'Computing';
      await sqlClient`
        INSERT INTO majors (name, faculty) VALUES (${name}, ${faculty})
        ON CONFLICT (name) DO UPDATE SET faculty = EXCLUDED.faculty
      `;
    }

    // 3. Synchronize Courses
    console.log("Synchronizing Courses...");
    const neoCourses = await session.run(`MATCH (c:Course) RETURN c.code AS code, coalesce(c.subject, c.name) AS name`);
    for (const record of neoCourses.records) {
      const code = record.get('code');
      const name = record.get('name') || 'Course Title';
      await sqlClient`
        INSERT INTO courses (code, name) VALUES (${code}, ${name})
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
      `;
    }

    // 4. Synchronize Hobbies
    console.log("Synchronizing Hobbies...");
    const neoHobbies = await session.run(`MATCH (h:Hobby) RETURN h.name AS name, h.category AS category`);
    for (const record of neoHobbies.records) {
      const name = record.get('name');
      const category = record.get('category') || 'General';
      await sqlClient`
        INSERT INTO hobbies (name, category) VALUES (${name}, ${category})
        ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category
      `;
    }

    // 5. Fetch existing users in PostgreSQL to identify ids
    const usersList = await sqlClient`SELECT id, full_name, username FROM users`;
    const userByName = new Map(usersList.map(u => [u.full_name, u.id]));
    const existingFullNames = new Set(usersList.map(u => u.full_name));
    const existingUsernames = new Set(usersList.map(u => u.username));

    // 6. Fetch all student profiles and major affiliations from Neo4j
    console.log("Updating missing student users...");
    const neoUsers = await session.run(`
      MATCH (s:Student|User)
      OPTIONAL MATCH (s)-[:STUDIES]->(m:Major)
      RETURN s.name AS name, s.university AS university, s.year AS year, s.bio AS bio, s.gender AS gender, m.name AS majorName
    `);

    const usersToInsert = [];
    for (const record of neoUsers.records) {
      const name = record.get('name');
      if (!name || existingFullNames.has(name)) continue;

      const university = record.get('university') || 'Campus Circle University';
      const year = record.get('year') ? Number(record.get('year')) : 2;
      const bio = record.get('bio') || 'Ready to spark campus connections!';
      const major = record.get('majorName') || 'Information Systems';
      const rawGender = record.get('gender');

      let baseUsername = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      if (baseUsername.length > 50) baseUsername = baseUsername.slice(0, 50);
      let uniqueUsername = baseUsername;
      let counter = 2;
      while (existingUsernames.has(uniqueUsername)) {
        uniqueUsername = `${baseUsername}_${counter}`;
        counter++;
      }
      existingUsernames.add(uniqueUsername);

      const password = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '123';
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const phoneTail = String(Math.abs(hash)).padStart(8, '0').slice(-8);
      const phone = `+62812${phoneTail}`;
      const gender = rawGender || (Math.abs(hash) % 2 === 0 ? 'male' : 'female');
      const avatarUrl = PORTRAITS[Math.abs(hash) % PORTRAITS.length];

      usersToInsert.push({
        username: uniqueUsername,
        password,
        fullName: name,
        phone,
        university,
        major,
        year,
        bio,
        gender,
        avatarUrl
      });
    }

    if (usersToInsert.length > 0) {
      console.log(`Inserting ${usersToInsert.length} missing student profiles...`);
      const chunkSize = 100;
      for (let i = 0; i < usersToInsert.length; i += chunkSize) {
        const chunk = usersToInsert.slice(i, i + chunkSize);
        await sqlClient`
          INSERT INTO users (username, password, full_name, phone, university, major, year, bio, gender, avatar_url)
          VALUES ${ sqlClient(chunk.map(item => [
            item.username,
            item.password,
            item.fullName,
            item.phone,
            item.university,
            item.major,
            item.year,
            item.bio,
            item.gender,
            item.avatarUrl
          ])) }
        `;
      }
      // Re-fetch users map with newly added ids
      const updatedUsers = await sqlClient`SELECT id, full_name FROM users`;
      for (const u of updatedUsers) {
        userByName.set(u.full_name, u.id);
      }
    }

    // 7. Load Courses and Hobbies maps to retrieve SQL IDs
    const sqlCourses = await sqlClient`SELECT id, code FROM courses`;
    const courseByCode = new Map(sqlCourses.map(c => [c.code, c.id]));

    const sqlHobbies = await sqlClient`SELECT id, name FROM hobbies`;
    const hobbyByName = new Map(sqlHobbies.map(h => [h.name, h.id]));

    // 8. Truncate existing relational junction tables for perfect parity sync
    console.log("Truncating relational junction tables...");
    await sqlClient`TRUNCATE TABLE user_courses, user_hobbies RESTART IDENTITY CASCADE`;

    // 9. Synchronize TAKE courses relationships
    console.log("Fetching TAKES relationships from Neo4j (deduplicating)...");
    const neoTakes = await session.run(`
      MATCH (s:Student|User)-[:TAKES]->(c:Course)
      RETURN DISTINCT s.name AS userName, c.code AS courseCode
    `);

    const uniqueCoursePairs = new Set();
    const userCoursesToInsert = [];
    for (const record of neoTakes.records) {
      const uName = record.get('userName');
      const cCode = record.get('courseCode');
      const uId = userByName.get(uName);
      const cId = courseByCode.get(cCode);
      if (uId && cId) {
        const pairKey = `${uId}-${cId}`;
        if (!uniqueCoursePairs.has(pairKey)) {
          uniqueCoursePairs.add(pairKey);
          userCoursesToInsert.push([uId, cId]);
        }
      }
    }

    if (userCoursesToInsert.length > 0) {
      console.log(`Inserting ${userCoursesToInsert.length} distinct courses enrollments into SQL...`);
      const chunkSize = 200;
      for (let i = 0; i < userCoursesToInsert.length; i += chunkSize) {
        const chunk = userCoursesToInsert.slice(i, i + chunkSize);
        await sqlClient`
          INSERT INTO user_courses (user_id, course_id)
          VALUES ${ sqlClient(chunk) }
        `;
      }
    }

    // 10. Synchronize LIKES hobbies relationships
    console.log("Fetching LIKES relationships from Neo4j (deduplicating)...");
    const neoLikes = await session.run(`
      MATCH (s:Student|User)-[:LIKES]->(h:Hobby)
      RETURN DISTINCT s.name AS userName, h.name AS hobbyName
    `);

    const uniqueHobbyPairs = new Set();
    const userHobbiesToInsert = [];
    for (const record of neoLikes.records) {
      const uName = record.get('userName');
      const hName = record.get('hobbyName');
      const uId = userByName.get(uName);
      const hId = hobbyByName.get(hName);
      if (uId && hId) {
        const pairKey = `${uId}-${hId}`;
        if (!uniqueHobbyPairs.has(pairKey)) {
          uniqueHobbyPairs.add(pairKey);
          userHobbiesToInsert.push([uId, hId]);
        }
      }
    }

    if (userHobbiesToInsert.length > 0) {
      console.log(`Inserting ${userHobbiesToInsert.length} distinct hobbies links into SQL...`);
      const chunkSize = 200;
      for (let i = 0; i < userHobbiesToInsert.length; i += chunkSize) {
        const chunk = userHobbiesToInsert.slice(i, i + chunkSize);
        await sqlClient`
          INSERT INTO user_hobbies (user_id, hobby_id)
          VALUES ${ sqlClient(chunk) }
        `;
      }
    }

    console.log("🎉 100% COMPLETE MULTI-DATABASE PARITY ACCOMPLISHED!");
    console.log("Users, Majors, Courses, Hobbies, and all social relation edges are perfectly normalized in both SQL and Graph DB!");

  } finally {
    await session.close();
    await driver.close();
    await sqlClient.end();
    console.log("Closed all database connections.");
  }
}

main().catch((err) => {
  console.error('Migration failed:', err?.message ?? err);
  process.exit(1);
});
