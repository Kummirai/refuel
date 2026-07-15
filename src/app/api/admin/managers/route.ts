import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const { db } = await connectToDatabase();
    const usersCollection = db.collection("user");
    const query: any = { role: "manager" };
    if (search) {
      const esc = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: esc, $options: "i" } },
        { email: { $regex: esc, $options: "i" } },
      ];
    }
    const managers = await usersCollection
      .find(query)
      .project({ name: 1, email: 1, phone: 1, role: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      managers.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        createdAt: u.createdAt,
      })),
    );
  } catch (error) {
    console.error("Error fetching managers:", error);
    return NextResponse.json({ error: "Failed to fetch managers" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: "Missing userId or role" }, { status: 400 });
    }

    if (!["manager", "driver"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("user");

    let objectId;
    try {
      objectId = new ObjectId(userId);
    } catch {
      return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
    }

    const result = await usersCollection.updateOne(
      { _id: objectId },
      { $set: { role } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `User role updated to ${role}` });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
