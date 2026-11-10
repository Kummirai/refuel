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

    const { carRegistrationNumber, carModel, carYear, carColor } =
      await request.json();

    if (!carRegistrationNumber || !carRegistrationNumber.trim()) {
      return NextResponse.json(
        { error: "Car registration number is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();

    const updateFields: Record<string, any> = { updatedAt: new Date() };
    const changes: { field: string; newValue: string }[] = [];

    if (carRegistrationNumber?.trim()) {
      updateFields.carRegistrationNumber = carRegistrationNumber.trim();
      changes.push({
        field: "Car Registration",
        newValue: carRegistrationNumber.trim(),
      });
    }
    if (carModel?.trim()) {
      updateFields.carModel = carModel.trim();
      changes.push({ field: "Car Model", newValue: carModel.trim() });
    }
    if (carYear?.trim()) {
      updateFields.carYear = carYear.trim();
      updateFields.carYearInt = parseInt(carYear) || 0;
      changes.push({ field: "Car Year", newValue: carYear.trim() });
    }
    if (carColor?.trim()) {
      updateFields.carColor = carColor.trim();
      changes.push({ field: "Car Color", newValue: carColor.trim() });
    }

    const result = await db.collection("driverProfiles").updateOne(
      { userId: session.user.id },
      { $set: updateFields },
    );

    // Trigger push notification if token exists
    const user = await db.collection("user").findOne({ _id: new ObjectId(session.user.id) });
    const pushTokens = user?.pushTokens?.length ? user.pushTokens : user?.expoPushToken ? [user.expoPushToken] : [];

    if (pushTokens.length) {

      await sendPushNotification(

        pushTokens,
        "Vehicle Updated",
        "Your vehicle details have been updated successfully.",
        { screen: "Profile" }
      );
    }

    (async () => {
      try {
        await sendAdminProfileChangeEmail({
          driverName: session.user.name || "Driver",
          driverEmail: session.user.email || "",
          changes,
        });
      } catch (emailError) {
        console.error("Failed to send profile change email:", emailError);
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Vehicle details updated successfully",
      matchedCount: result.matchedCount,
    });
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update vehicle details" },
      { status: 500 },
    );
  }
}
