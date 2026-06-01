// scripts/create-manager.ts
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import path from "path";
import readline from "readline";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined");
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function convertToManager() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧 CONVERT USER TO MANAGER");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db(MONGODB_DB);
    const usersCollection = db.collection("user");

    const allUsers = await usersCollection.find({}).toArray();

    if (allUsers.length === 0) {
      console.log("❌ No users found in the database.");
      console.log("Please create a user first via sign-up page.\n");
      process.exit(0);
    }

    console.log("📋 Existing Users:\n");
    console.log("IDX | EMAIL | NAME | CURRENT ROLE");
    console.log("─────────────────────────────────────────────");

    allUsers.forEach((user, index) => {
      const role = user.role || "driver";
      const roleIcon = role === "admin" ? "👑" : role === "manager" ? "⭐" : "🚗";
      console.log(
        `${index + 1}.  ${roleIcon} ${user.email} | ${user.name || "N/A"} | Role: ${role}`,
      );
    });

    console.log("\n─────────────────────────────────────────────\n");

    const userInput = await question(
      "Enter the number or email of the user to make manager: ",
    );

    let selectedUser = null;

    const index = parseInt(userInput) - 1;
    if (!isNaN(index) && index >= 0 && index < allUsers.length) {
      selectedUser = allUsers[index];
    } else {
      selectedUser = allUsers.find((u) => u.email === userInput);
    }

    if (!selectedUser) {
      console.log("\n❌ User not found!");
      process.exit(0);
    }

    console.log(`\n📧 Selected User: ${selectedUser.email}`);
    console.log(`👤 Name: ${selectedUser.name || "N/A"}`);
    console.log(`🔑 Current Role: ${selectedUser.role || "driver"}\n`);

    if (selectedUser.role === "manager") {
      console.log("⚠️  This user is already a manager.\n");
      process.exit(0);
    }

    const confirm = await question(
      "Are you sure you want to make this user a manager? (yes/no): ",
    );

    if (confirm.toLowerCase() !== "yes") {
      console.log("\n❌ Operation cancelled.");
      process.exit(0);
    }

    const result = await usersCollection.updateOne(
      { _id: selectedUser._id },
      {
        $set: {
          role: "manager",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount > 0) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ USER CONVERTED TO MANAGER SUCCESSFULLY!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📧 Email: ${selectedUser.email}`);
      console.log(`🔑 Password: (unchanged - use their existing password)`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      console.log("📱 They can now log in and access the manager panel at /manager/dashboard\n");
      console.log("📱 Or use the Kapuka mobile app with the Manager role\n");
    } else {
      console.log("\n❌ Failed to update user role.\n");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    rl.close();
    console.log("🔌 Disconnected from MongoDB\n");
  }
}

convertToManager();
