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

if (!MONGODB_URI || !MONGODB_DB) {
  console.error("Missing MONGODB_URI or MONGODB_DB in .env.local");
  process.exit(1);
}

const backupDir = process.argv[2];

if (!backupDir) {
  console.error("Usage: npm run restore -- <backup-directory>");
  console.error("Example: npm run restore -- ./backups/refuel_local_2026-05-15T12-00-00-000Z");
  process.exit(1);
}

async function restore() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    const files = fs.readdirSync(backupDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const collectionName = file.replace(".json", "");
      const filePath = path.join(backupDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const docs = JSON.parse(raw);

      if (docs.length === 0) {
        console.log(`  - ${collectionName}: empty, skipping`);
        continue;
      }

      await db.collection(collectionName).deleteMany({});
      await db.collection(collectionName).insertMany(docs);
      console.log(`  ✓ ${collectionName} → ${docs.length} docs restored`);
    }

    console.log(`\nRestore complete from: ${backupDir}`);
  } catch (error) {
    console.error("Restore failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

restore();
