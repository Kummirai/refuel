// scripts/setup-db.ts
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

async function setupDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(MONGODB_DB);

    // Users collection indexes
    const usersCollection = db.collection("users");
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ role: 1 });
    await usersCollection.createIndex({ verificationStatus: 1 });

    // Driver Profiles collection indexes
    const driverProfilesCollection = db.collection("driverProfiles");
    await driverProfilesCollection.createIndex({ userId: 1 }, { unique: true });
    await driverProfilesCollection.createIndex({ carRegistrationNumber: 1 });

    // Service Requests collection indexes
    const serviceRequestsCollection = db.collection("serviceRequests");
    await serviceRequestsCollection.createIndex({ userId: 1 });
    await serviceRequestsCollection.createIndex({ status: 1 });
    await serviceRequestsCollection.createIndex({ requestDate: -1 });

    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error setting up database:", error);
  } finally {
    await client.close();
  }
}

setupDatabase();
