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
  if (!v) throw new Error(`Missing env ${name}. Create .env.local or .env in frontend.`);
  return v;
}

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

    // 1. Clear existing swipes and matches in both databases to start fresh
    console.log("Cleaning up existing swipes and matches in PostgreSQL and Neo4j...");
    await sqlClient`TRUNCATE TABLE swipes RESTART IDENTITY CASCADE`;
    
    await session.run(`
      MATCH (s1:Student)-[r:SWIPED]->(s2:Student)
      DELETE r
    `);
    await session.run(`
      MATCH (s1:Student)-[r:MATCHES]->(s2:Student)
      DELETE r
    `);
    console.log("Database clean up done.");

    // 2. Fetch all users from PostgreSQL
    console.log("Fetching users...");
    const users = await sqlClient`SELECT id, full_name FROM users`;
    console.log(`Found ${users.length} users in PostgreSQL.`);

    if (users.length < 2) {
      console.log("Not enough users to seed swipes.");
      return;
    }

    const swipesToInsertPg = [];
    const neo4jQueries = [];

    // Track swipes to prevent duplicates
    const swipedPairs = new Set();

    // Helper to add swipe to batches
    function addSwipe(swiperId, swiperName, targetId, targetName, type) {
      const pairKey = `${swiperId}-${targetId}`;
      if (swipedPairs.has(pairKey)) return;
      swipedPairs.add(pairKey);

      swipesToInsertPg.push({
        swiper_id: swiperId,
        target_id: targetId,
        swipe_type: type
      });

      neo4jQueries.push({
        query: `
          MATCH (s1:Student {name: $swiperName})
          MATCH (s2:Student {name: $targetName})
          MERGE (s1)-[r:SWIPED]->(s2)
          SET r.type = $type
        `,
        params: { swiperName, targetName, type }
      });
    }

    // Helper to add match to Neo4j
    function addMatch(name1, name2) {
      neo4jQueries.push({
        query: `
          MATCH (s1:Student {name: $name1})
          MATCH (s2:Student {name: $name2})
          MERGE (s1)-[:MATCHES]->(s2)
          MERGE (s2)-[:MATCHES]->(s1)
        `,
        params: { name1, name2 }
      });
    }

    console.log("Generating random swipes...");

    for (let i = 0; i < users.length; i++) {
      const userA = users[i];
      
      // Shuffle other users to pick candidates randomly
      const others = users.filter(u => u.id !== userA.id);
      const shuffledOthers = others.sort(() => 0.5 - Math.random());
      
      // Swipe on 4 to 8 random other users
      const swipeCount = Math.floor(Math.random() * 5) + 4; 
      const candidates = shuffledOthers.slice(0, Math.min(swipeCount, shuffledOthers.length));

      for (const userB of candidates) {
        const pairKey = `${userA.id}-${userB.id}`;
        const reverseKey = `${userB.id}-${userA.id}`;
        
        if (swipedPairs.has(pairKey)) continue;

        // Choose a random swipe action:
        // 50% chance of 'like', 10% chance of 'super', 40% chance of 'nope'
        const rand = Math.random();
        let swipeTypeA = 'nope';
        if (rand < 0.5) {
          swipeTypeA = 'like';
        } else if (rand < 0.6) {
          swipeTypeA = 'super';
        }

        addSwipe(userA.id, userA.full_name, userB.id, userB.full_name, swipeTypeA);

        if (swipeTypeA === 'like' || swipeTypeA === 'super') {
          // If B hasn't swiped A yet, let's decide if B swiped A
          if (!swipedPairs.has(reverseKey)) {
            const randB = Math.random();
            if (randB < 0.35) {
              // Mutual match! B likes A back
              const swipeTypeB = Math.random() < 0.15 ? 'super' : 'like';
              addSwipe(userB.id, userB.full_name, userA.id, userA.full_name, swipeTypeB);
              addMatch(userA.full_name, userB.full_name);
            } else if (randB < 0.6) {
              // B nopes A
              addSwipe(userB.id, userB.full_name, userA.id, userA.full_name, 'nope');
            }
            // Otherwise, B hasn't swiped on A yet
          }
        } else {
          // A nopes B. B might still have liked A or noped A.
          if (!swipedPairs.has(reverseKey)) {
            const randB = Math.random();
            if (randB < 0.2) {
              const swipeTypeB = Math.random() < 0.1 ? 'super' : 'like';
              addSwipe(userB.id, userB.full_name, userA.id, userA.full_name, swipeTypeB);
            } else if (randB < 0.4) {
              addSwipe(userB.id, userB.full_name, userA.id, userA.full_name, 'nope');
            }
          }
        }
      }
    }

    // 3. Perform bulk inserts in PostgreSQL
    if (swipesToInsertPg.length > 0) {
      console.log(`Inserting ${swipesToInsertPg.length} swipes into PostgreSQL...`);
      const chunkSize = 150;
      for (let i = 0; i < swipesToInsertPg.length; i += chunkSize) {
        const chunk = swipesToInsertPg.slice(i, i + chunkSize);
        await sqlClient`
          INSERT INTO swipes (swiper_id, target_id, swipe_type)
          VALUES ${ sqlClient(chunk.map(item => [item.swiper_id, item.target_id, item.swipe_type])) }
        `;
      }
    }

    // 4. Perform queries in Neo4j using transactions
    if (neo4jQueries.length > 0) {
      console.log(`Writing ${neo4jQueries.length} relationships into Neo4j...`);
      const chunkSize = 100;
      for (let i = 0; i < neo4jQueries.length; i += chunkSize) {
        const chunk = neo4jQueries.slice(i, i + chunkSize);
        await session.executeWrite(async (tx) => {
          for (const item of chunk) {
            await tx.run(item.query, item.params);
          }
        });
      }
    }

    // Verify results
    const pgSwipeCount = await sqlClient`SELECT COUNT(*) FROM swipes`;
    const neoSwipedCount = await session.run(`MATCH ()-[r:SWIPED]->() RETURN count(r) AS count`);
    const neoMatchesCount = await session.run(`MATCH ()-[r:MATCHES]->() RETURN count(r) AS count`);

    console.log("--------------------------------------------------");
    console.log("🎉 RANDOM SWIPE AND MATCH SEEDING COMPLETE!");
    console.log(`PostgreSQL Swipes Count: ${pgSwipeCount[0].count}`);
    console.log(`Neo4j SWIPED relationships: ${neoSwipedCount.records[0].get('count').toString()}`);
    console.log(`Neo4j MATCHES relationships (directed): ${neoMatchesCount.records[0].get('count').toString()}`);
    console.log("--------------------------------------------------");

  } finally {
    await session.close();
    await driver.close();
    await sqlClient.end();
    console.log("Closed all database connections.");
  }
}

main().catch((err) => {
  console.error('Seeding swipes failed:', err?.message ?? err);
  process.exit(1);
});
