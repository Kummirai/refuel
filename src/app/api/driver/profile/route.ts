import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendPushNotification, sendAdminPushNotification } from "@/lib/notifications";
import { sendAdminProfileChangeEmail } from "@/lib/email";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const driverProfiles = db.collection("driverProfiles");

    const profile = await driverProfiles.findOne({ userId });

    return NextResponse.json({
      ...profile,
      rating: profile?.rating || 0,
      rejectionReason: profile?.rejectionReason || null,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, ...updates } = body;

    // Ensure user can only update their own profile
    const targetUserId = session.user.id;

    const { db } = await connectToDatabase();
    const driverProfiles = db.collection("driverProfiles");
    const usersCollection = db.collection("user");

    const result = await driverProfiles.updateOne(
      { userId: targetUserId },
      { $set: { ...updates, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Trigger push notification if token exists
    const user = await usersCollection.findOne({ _id: new ObjectId(targetUserId) });
    const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

    if (pushTokens.length) {

      await sendPushNotification(

        pushTokens,
        "Profile Updated",
        "Your profile details have been updated successfully.",
        { screen: "Profile" }
      );
    }

    // Notify admins of profile changes
    const changes = Object.entries(updates).map(([field, newValue]) => ({
      field,
      newValue: String(newValue),
    }));

    (async () => {
      try {
        await sendAdminPushNotification(
          "Driver Profile Updated",
          `${session.user.name || "A driver"} updated their profile.`,
          { screen: "AdminDashboard" }
        );

        await sendAdminProfileChangeEmail({
          driverName: session.user.name || "Driver",
          driverEmail: session.user.email || "",
          changes,
        });
      } catch (notifError) {
        console.error("Failed to send admin notification:", notifError);
      }
    })();

    return NextResponse.json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}
