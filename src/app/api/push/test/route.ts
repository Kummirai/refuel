import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { Expo } from "expo-server-sdk";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, body: messageBody, data } = body;

    console.log("📨 Attempting to send push:", { userId, title });

    await client.connect();
    const db = client.db("refuel");
    const users = db.collection("user");

    // Get user with push token
    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { pushToken: 1 } },
    );

    if (!user || !user.pushToken) {
      return NextResponse.json(
        { error: "User does not have a registered push token" },
        { status: 404 },
      );
    }

    console.log("📱 Found push token for user:", user.pushToken);

    // Initialize Expo SDK
    const expo = new Expo();

    // Check if token is valid Expo token
    if (!Expo.isExpoPushToken(user.pushToken)) {
      return NextResponse.json(
        { error: "Invalid Expo push token format" },
        { status: 400 },
      );
    }

    // Send notification
    const messages = [
      {
        to: user.pushToken,
        sound: "default",
        title: title,
        body: messageBody,
        data: data || {},
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error("Error sending chunk:", error);
      }
    }

    // Handle invalid tokens
    for (const ticket of tickets) {
      if (
        ticket.status === "error" &&
        ticket.message === "DeviceNotRegistered"
      ) {
        console.log("❌ Token invalid, removing from database");
        await users.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { pushToken: null, pushTokenValid: false } },
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
  } finally {
    await client.close();
  }
}
