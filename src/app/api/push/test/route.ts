import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Expo } from "expo-server-sdk";

const expo = new Expo();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, body: messageBody, data } = body;

    console.log("📨 Attempting to send push:", { userId, title });

    const { db } = await connectToDatabase();
    const users = db.collection("user");

    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { pushTokens: 1, expoPushToken: 1, role: 1 } },
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 },
      );
    }

    const tokens = user.pushTokens?.length
      ? user.pushTokens
      : user.expoPushToken
        ? [user.expoPushToken]
        : [];

    if (tokens.length === 0) {
      return NextResponse.json(
        { error: "User does not have registered push tokens" },
        { status: 404 },
      );
    }

    console.log("📱 Found push tokens for user:", tokens);

    const validTokens = tokens.filter((t: string) =>
      Expo.isExpoPushToken(t),
    );

    if (validTokens.length === 0) {
      return NextResponse.json(
        { error: "No valid Expo push tokens" },
        { status: 400 },
      );
    }

    const messages = validTokens.map((to: string) => ({
      to,
      sound: "default" as const,
      title: title || "Test Notification",
      body: messageBody || "This is a test push notification",
      data: data || {},
    }));

    const tickets = await expo.sendPushNotificationsAsync(messages);

    for (const ticket of tickets) {
      if (
        ticket.status === "error" &&
        "message" in ticket &&
        ticket.message === "DeviceNotRegistered"
      ) {
        console.log("❌ Token invalid, removing from database");
        const invalidToken = (ticket.details as any)?.expoPushToken as string;
        if (user.role === "manager" || user.role === "admin") {
          await users.updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { pushTokens: invalidToken } },
          );
        } else {
          await users.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { expoPushToken: null, pushTokenValid: false } },
          );
        }
      }
    }

    console.log("✅ Push sent successfully:", tickets);

    return NextResponse.json({
      success: true,
      tickets,
      message: "Push notification sent",
    });
  } catch (error) {
    console.error("Push error:", error);
    return NextResponse.json(
      { error: "Failed to send push notification" },
      { status: 500 },
    );
  }
}
