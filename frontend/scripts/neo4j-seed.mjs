import fs from 'node:fs';
import path from 'node:path';
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
    const value = line.slice(idx + 1).trim();
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

function stripLineComments(text) {
  return text
    .split(/\r?\n/)
    .map((line) => (line.trimStart().startsWith('//') ? '' : line))
    .join('\n');
}

function splitStatements(text) {
  const noComments = stripLineComments(text);
  return noComments
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const cwd = process.cwd();
  loadEnvFile(path.join(cwd, '.env.local'));
  loadEnvFile(path.join(cwd, '.env'));

  const uri = requiredEnv('NEO4J_URI');
  const username = requiredEnv('NEO4J_USERNAME');
  const password = requiredEnv('NEO4J_PASSWORD');
  const database = process.env.NEO4J_DATABASE || undefined;

  const seedFile = path.resolve(cwd, '..', 'neo4j', 'seed.cypher');
  if (!fs.existsSync(seedFile)) {
    throw new Error(`seed.cypher not found: ${seedFile}`);
  }

  const statements = splitStatements(fs.readFileSync(seedFile, 'utf8'));
  if (statements.length === 0) {
    throw new Error('seed.cypher is empty');
  }

  const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
  const session = driver.session({ database });

  try {
    await driver.verifyConnectivity();

    let executed = 0;
    await session.executeWrite(async (tx) => {
      for (const stmt of statements) {
        await tx.run(stmt);
        executed += 1;
      }
    });

    console.log(`Seed OK. Statements executed: ${executed}`);
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err?.message ?? err);
  process.exit(1);
});
