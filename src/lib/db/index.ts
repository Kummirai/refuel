import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI environment variable");
}

if (!MONGODB_DB) {
  throw new Error("Please define MONGODB_DB environment variable");
}

let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  // Create collections and indexes if they don't exist
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  // Users collection (Better Auth creates this, but we add indexes)
  if (!collectionNames.includes("users")) {
    await db.createCollection("users");
  }

  // Driver Profiles collection
  if (!collectionNames.includes("driverProfiles")) {
    await db.createCollection("driverProfiles");
    await db
      .collection("driverProfiles")
      .createIndex({ userId: 1 }, { unique: true });
    await db
      .collection("driverProfiles")
      .createIndex({ carRegistrationNumber: 1 });
    await db
      .collection("driverProfiles")
      .createIndex({ verificationStatus: 1 });
  }

  // Service Requests collection
  if (!collectionNames.includes("serviceRequests")) {
    await db.createCollection("serviceRequests");
    await db.collection("serviceRequests").createIndex({ userId: 1 });
    await db.collection("serviceRequests").createIndex({ status: 1 });
    await db.collection("serviceRequests").createIndex({ requestDate: -1 });
  }

  return { client, db };
}
