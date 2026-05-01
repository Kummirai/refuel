// src/lib/auth/index.ts
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db(process.env.MONGODB_DB!);

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(url, user) {
      // Send reset password email
      console.log(`Reset password URL: ${url}`);
    },
  },
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: true,
      },
      role: {
        type: "string",
        defaultValue: "driver",
      },
      isVerified: {
        type: "boolean",
        defaultValue: false,
      },
      verificationStatus: {
        type: "string",
        defaultValue: "not_submitted",
      },
      totalRequests: {
        type: "number",
        defaultValue: 0,
      },
      totalSpent: {
        type: "number",
        defaultValue: 0,
      },
      rating: {
        type: "number",
        defaultValue: 0,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    cookiePrefix: "Kapuka",
  },
});
