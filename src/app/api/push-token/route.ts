import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pushToken } = body;

    console.log("📱 Received push token registration:", { userId, pushToken });

    if (!userId || !pushToken) {
      return NextResponse.json(
        { error: "Missing userId or pushToken" },
        { status: 400 },
      );
    }

    await client.connect();
    const db = client.db("refuel"); // Change to your DB name
    const users = db.collection("user");

    // Update user with push token
    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          pushToken: pushToken,
          pushTokenUpdatedAt: new Date(),
          pushTokenValid: true,
        },
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ Push token registered for user:", userId);

    return NextResponse.json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (error) {
    console.error("❌ Error registering push token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    await client.close();
  }
}

// GET endpoint to check if user has a token
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await client.connect();
    const db = client.db("your_database_name");
    const users = db.collection("users");

    const user = await users.findOne(
      { _id: new ObjectId(userId) },
      { projection: { pushToken: 1, pushTokenUpdatedAt: 1 } },
    );

    return NextResponse.json({
      hasPushToken: !!user?.pushToken,
      pushToken: user?.pushToken || null,
      updatedAt: user?.pushTokenUpdatedAt || null,
    });
  } catch (error) {
    console.error("Error checking token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  } finally {
    await client.close();
  }
}
