import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI environment variable");
}

if (!MONGODB_DB) {
  throw new Error("Please define MONGODB_DB environment variable");
}

const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoDb?: any;
};

function createClient() {
  return new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 0,
    maxIdleTimeMS: 10000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
  });
}

export function getClient() {
  if (globalWithMongo._mongoClient) {
    return globalWithMongo._mongoClient;
  }
  const client = createClient();
  globalWithMongo._mongoClient = client;
  return client;
}

export async function connectToDatabase() {
  if (globalWithMongo._mongoClient && globalWithMongo._mongoDb) {
    return { client: globalWithMongo._mongoClient, db: globalWithMongo._mongoDb };
  }

  if (!globalWithMongo._mongoClient) {
    globalWithMongo._mongoClient = createClient();
  }
  const client = globalWithMongo._mongoClient;

  await client.connect();
  const db = client.db(MONGODB_DB);

  globalWithMongo._mongoDb = db;

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

  // Service Requests collection — indexes (idempotent, runs every time)
  await db.collection("serviceRequests").createIndex({ userId: 1 });
  await db.collection("serviceRequests").createIndex({ status: 1 });
  await db.collection("serviceRequests").createIndex({ requestDate: -1 });
  await db.collection("serviceRequests").createIndex({ userId: 1, status: 1 });
  await db.collection("serviceRequests").createIndex({ completedDate: -1, hasReceipt: 1 });

  // Repayment Proofs collection
  await db.collection("repaymentProofs").createIndex({ requestId: 1 });
  await db.collection("repaymentProofs").createIndex({ requestIds: 1 });
  await db.collection("repaymentProofs").createIndex({ status: 1 });

  // User collection — queried by role for driver listing
  await db.collection("user").createIndex({ role: 1 });

  return { client, db };
}

export async function getUsersCollection() {
  const { db } = await connectToDatabase();
  return db.collection("users");
}

export async function getDriverProfilesCollection() {
  const { db } = await connectToDatabase();
  return db.collection("driverProfiles");
}

export async function getServiceRequestsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("serviceRequests");
}
