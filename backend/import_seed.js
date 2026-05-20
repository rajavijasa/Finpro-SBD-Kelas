const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');

// Read database credentials
const envPath = path.join(__dirname, '.env');
let uri = 'neo4j+s://cf303675.databases.neo4j.io';
let user = 'cf303675';
let password = '4Nu_rkz5v04R0R0O2-duhgRYOO5ZsiM_mBRdPOHz_3w';
let database = 'cf303675';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'NEO4J_URI') uri = val;
      if (key === 'NEO4J_USERNAME') user = val;
      if (key === 'NEO4J_PASSWORD') password = val;
      if (key === 'NEO4J_DATABASE') database = val;
    }
  });
}

console.log('Connecting to Neo4j Instance at:', uri);
console.log('Using User:', user);
console.log('Database:', database);

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Parallel Session Concurrency Config
const CONCURRENCY_LIMIT = 50;

async function runImporter() {
  const seedPath = path.join(__dirname, '../neo4j/seed.cypher');
  if (!fs.existsSync(seedPath)) {
    console.error('ERROR: seed.cypher not found at', seedPath);
    process.exit(1);
  }

  // Load and parse Cypher statements
  const rawContent = fs.readFileSync(seedPath, 'utf8');

  const statements = rawContent
    .split(';')
    .map(s => s.trim())
    .filter(s => {
      if (s.length === 0) return false;
      const lines = s.split('\n').map(l => l.trim());
      const firstRealLine = lines.find(l => l.length > 0);
      return firstRealLine && !firstRealLine.startsWith('//');
    });

  console.log(`\nFound ${statements.length} Cypher seed statements to execute...`);

  try {
    // 1. Clear Database first
    const deleteStatement = statements.find(s => s.includes('DETACH DELETE'));
    if (deleteStatement) {
      console.log('Executing database reset...');
      const resetSession = driver.session({ database });
      await resetSession.run(deleteStatement);
      await resetSession.close();
    }

    console.log(`Starting concurrent session import (Concurrency Limit: ${CONCURRENCY_LIMIT})...`);

    const otherStatements = statements.filter(s => !s.includes('DETACH DELETE'));
    const startTime = Date.now();
    let successCount = 0;

    // Chunk statements into batches and execute concurrently
    for (let i = 0; i < otherStatements.length; i += CONCURRENCY_LIMIT) {
      const batch = otherStatements.slice(i, i + CONCURRENCY_LIMIT);

      await Promise.all(
        batch.map(async (stmt) => {
          const tempSession = driver.session({ database });
          try {
            await tempSession.run(stmt);
            successCount++;
          } catch (err) {
            console.error(`Failed statement:\n"${stmt.substring(0, 100)}..."\nReason:`, err.message);
          } finally {
            await tempSession.close();
          }
        })
      );

      const percent = Math.min(100, Math.round(((i + batch.length) / otherStatements.length) * 100));
      console.log(`Progress: Loaded ${successCount} / ${otherStatements.length} statements (${percent}%)...`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\n==================================================');
    console.log(`🎉 SUCCESS: Database fully seeded in ${duration}s!`);
    console.log(`Successfully completed ${successCount} Cypher transactions.`);
    console.log('==================================================');

  } catch (error) {
    console.error('Import failed with exception:', error);
  } finally {
    await driver.close();
  }
}

runImporter();
