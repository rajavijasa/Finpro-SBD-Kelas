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

  console.log("Connecting to PostgreSQL Supabase database...");
  const sqlClient = postgres(sqlConnectionString, { prepare: false });

  console.log("Connecting to Neo4j Graph database...");
  const driver = neo4j.driver(neo4jUri, neo4j.auth.basic(neoUsername, neoPassword));
  const session = driver.session({ database: neoDatabase });

  try {
    await driver.verifyConnectivity();
    console.log("Verified connections to both databases successfully!");

    // 1. Fetch existing users in PostgreSQL to identify collisions and prevent duplicates
    const existingUsers = await sqlClient`SELECT full_name, username FROM users`;
    const existingFullNames = new Set(existingUsers.map(u => u.full_name));
    const existingUsernames = new Set(existingUsers.map(u => u.username));

    // 2. Fetch all student profiles and major affiliations from Neo4j
    console.log("Fetching all student profiles from Neo4j...");
    const neoRes = await session.run(`
      MATCH (s:Student|User)
      OPTIONAL MATCH (s)-[:STUDIES]->(m:Major)
      RETURN s.name AS name, s.university AS university, s.year AS year, s.bio AS bio, s.gender AS gender, m.name AS majorName
    `);

    const toInsert = [];

    for (const record of neoRes.records) {
      const name = record.get('name');
      if (!name) continue;

      // Skip students already synchronized in PostgreSQL
      if (existingFullNames.has(name)) {
        continue;
      }

      const university = record.get('university') || 'Campus Circle University';
      const year = record.get('year') ? Number(record.get('year')) : 2;
      const bio = record.get('bio') || 'Ready to spark campus connections!';
      const major = record.get('majorName') || 'Information Systems';
      const rawGender = record.get('gender');

      // Generate deterministic unique username and password patterns matching format
      // e.g., fullName: John Doe -> username: john_doe, password: johndoe123
      let baseUsername = name.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      if (baseUsername.length > 50) {
        baseUsername = baseUsername.slice(0, 50);
      }
      
      let uniqueUsername = baseUsername;
      let counter = 2;
      while (existingUsernames.has(uniqueUsername)) {
        uniqueUsername = `${baseUsername}_${counter}`;
        counter++;
      }
      existingUsernames.add(uniqueUsername);

      const password = name.toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9]/g, '') + '123';

      // Generate deterministic phone number matching student name hash
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const phoneTail = String(Math.abs(hash)).padStart(8, '0').slice(-8);
      const phone = `+62812${phoneTail}`;

      const gender = rawGender || (Math.abs(hash) % 2 === 0 ? 'male' : 'female');
      const avatarUrl = PORTRAITS[Math.abs(hash) % PORTRAITS.length];

      toInsert.push({
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

    if (toInsert.length > 0) {
      console.log(`Found ${toInsert.length} student profiles in Neo4j missing from PostgreSQL.`);
      console.log("Synchronizing data and executing bulk insert into PostgreSQL...");

      const chunkSize = 100;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
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
      console.log(`Database synchronization complete! Synchronized ${toInsert.length} records!`);
    } else {
      console.log("Databases are already 100% perfectly synchronized! No new profiles to sync.");
    }

  } finally {
    await session.close();
    await driver.close();
    await sqlClient.end();
    console.log("Closed all database connections successfully!");
  }
}

main().catch((err) => {
  console.error('Database sync failed:', err?.message ?? err);
  process.exit(1);
});
