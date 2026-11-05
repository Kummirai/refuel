import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import type { Db } from "mongodb";
import { getClient } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const db = new Proxy({} as Db, {
  get(_target, property) {
    const database = getClient().db(process.env.MONGODB_DB!);
    const value = Reflect.get(database, property, database);
    return typeof value === "function" ? value.bind(database) : value;
  },
});

export const auth = betterAuth({
  database: mongodbAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET!,
  emailAndPassword: {
    enabled: true,
    async sendResetPassword(data) {
      const { user, token } = data as { user: { email: string; name?: string }; token: string };
      const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
      const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name || user.email,
        resetUrl,
      });
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
    useSecureCookies: true,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: true,
      path: "/"
    }
  },
   plugins: [nextCookies()]
});
