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
      { projection: { expoPushToken: 1 } },
    );

    if (!user || !user.expoPushToken) {
      return NextResponse.json(
        { error: "User does not have a registered push token" },
        { status: 404 },
      );
    }

    console.log("📱 Found push token for user:", user.expoPushToken);

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      return NextResponse.json(
        { error: "Invalid Expo push token format" },
        { status: 400 },
      );
    }

    const messages = [
      {
        to: user.expoPushToken,
        sound: "default" as const,
        title: title || "Test Notification",
        body: messageBody || "This is a test push notification",
        data: data || {},
      },
    ];

    const tickets = await expo.sendPushNotificationsAsync(messages);

    for (const ticket of tickets) {
      if (
        ticket.status === "error" &&
        "message" in ticket &&
        ticket.message === "DeviceNotRegistered"
      ) {
        console.log("❌ Token invalid, removing from database");
        await users.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { expoPushToken: null, pushTokenValid: false } },
        );
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
