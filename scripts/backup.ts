import { MongoClient } from "mongodb";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;
const BACKUP_DIRS = [
  path.resolve(__dirname, `../backups/${MONGODB_DB}_${new Date().toISOString().replace(/[:.]/g, "-")}`),
  ...(process.env.BACKUP_DIR_2
    ? [path.resolve(process.env.BACKUP_DIR_2, `${MONGODB_DB}_${new Date().toISOString().replace(/[:.]/g, "-")}`)]
    : []),
];

if (!MONGODB_URI || !MONGODB_DB) {
  console.error("Missing MONGODB_URI or MONGODB_DB in .env.local");
  process.exit(1);
}

async function backup() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    const collections = await db.listCollections().toArray();

    const allDocs: Record<string, object[]> = {};
    for (const collection of collections) {
      allDocs[collection.name] = await db.collection(collection.name).find({}).toArray();
    }

    for (const dir of BACKUP_DIRS) {
      fs.mkdirSync(dir, { recursive: true });

      for (const [name, docs] of Object.entries(allDocs)) {
        fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify(docs, null, 2), "utf-8");
        console.log(`  ✓ ${name} → ${dir}/${name}.json (${docs.length} docs)`);
      }
    }

    console.log(`\nBackup written to ${BACKUP_DIRS.length} location(s):`);
    for (const dir of BACKUP_DIRS) {
      console.log(`  • ${dir}`);
    }
  } catch (error) {
    console.error("Backup failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

backup();
