import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { sendAdminProfileChangeEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";
import { ObjectId } from "mongodb";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await request.json();

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 },
      );
    }

    await auth.api.updateUser({
      body: { phone: phone.trim() },
      headers: await headers(),
    });

    const { db } = await connectToDatabase();
    await db.collection("driverProfiles").updateOne(
      { userId: session.user.id },
      { $set: { driverPhone: phone.trim(), updatedAt: new Date() } },
    );

    // Trigger push notification if token exists
    const user = await db.collection("user").findOne({ _id: new ObjectId(session.user.id) });
    const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

    if (pushTokens.length) {

      await sendPushNotification(

        pushTokens,
        "Profile Updated",
        "Your phone number has been updated successfully.",
        { screen: "Profile" }
      );
    }

    (async () => {
      try {
        await sendAdminProfileChangeEmail({
          driverName: session.user.name || "Driver",
          driverEmail: session.user.email || "",
          changes: [
            {
              field: "Phone Number",
              newValue: phone.trim(),
            },
          ],
        });
      } catch (emailError) {
        console.error("Failed to send profile change email:", emailError);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Phone number updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating phone:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update phone number" },
      { status: 500 },
    );
  }
}
