// scripts/make-admin.ts
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import path from "path";
import readline from "readline";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB!;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not defined");
  process.exit(1);
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function convertToAdmin() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🔧 CONVERT USER TO ADMIN");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db(MONGODB_DB);
    // Better Auth uses 'user' collection
    const usersCollection = db.collection("user");

    // Get all users (excluding any existing admins for display)
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
      const roleIcon = role === "admin" ? "👑" : "🚗";
      console.log(
        `${index + 1}.  ${roleIcon} ${user.email} | ${user.name || "N/A"} | Role: ${role}`,
      );
    });

    console.log("\n─────────────────────────────────────────────\n");

    const userInput = await question(
      "Enter the number or email of the user to make admin: ",
    );

    let selectedUser = null;

    // Check if input is a number (index)
    const index = parseInt(userInput) - 1;
    if (!isNaN(index) && index >= 0 && index < allUsers.length) {
      selectedUser = allUsers[index];
    } else {
      // Search by email
      selectedUser = allUsers.find((u) => u.email === userInput);
    }

    if (!selectedUser) {
      console.log("\n❌ User not found!");
      process.exit(0);
    }

    console.log(`\n📧 Selected User: ${selectedUser.email}`);
    console.log(`👤 Name: ${selectedUser.name || "N/A"}`);
    console.log(`🔑 Current Role: ${selectedUser.role || "driver"}\n`);

    const confirm = await question(
      "Are you sure you want to make this user an admin? (yes/no): ",
    );

    if (confirm.toLowerCase() !== "yes") {
      console.log("\n❌ Operation cancelled.");
      process.exit(0);
    }

    // Update user to admin
    const result = await usersCollection.updateOne(
      { _id: selectedUser._id },
      {
        $set: {
          role: "admin",
          isVerified: true,
          verificationStatus: "approved",
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount > 0) {
      console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ USER CONVERTED TO ADMIN SUCCESSFULLY!");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📧 Email: ${selectedUser.email}`);
      console.log(`🔑 Password: (unchanged - use their existing password)`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      console.log(
        "⚠️  They can now log in and access the admin panel at /admin/dashboard\n",
      );
    } else {
      console.log(
        "\n❌ Failed to update user. They might already be an admin.\n",
      );
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    rl.close();
    console.log("🔌 Disconnected from MongoDB\n");
  }
}

// Run the function
convertToAdmin();
