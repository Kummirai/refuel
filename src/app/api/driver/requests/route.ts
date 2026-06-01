// src/app/api/driver/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { toMoney } from "@/lib/money";
import { sendAdminNotificationEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";
import { ObjectId } from "mongodb";

// ... (GET method remains unchanged) ...

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received request body:", body);

    const {
      userId,
      type,
      amount,
      carNumber,
      carModel,
      fuelType,
      contactPhone,
      interest,
      totalRepayable,
      interestRate,
      repaymentDays,
      dailyPayment,
      driverName,
      driverPhone,
      driverEmail,
      package: packageName,
      packageDescription,
      hasReceipt
    } = body;

    // Validate required fields
    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: userId, type, or amount" },
        { status: 400 },
      );
    }

    if (!contactPhone) {
      return NextResponse.json(
        { error: "Contact phone number is required" },
        { status: 400 },
      );
    }

    if (!carNumber) {
      return NextResponse.json(
        { error: "Car registration number is required" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

    // Prepare request data with all fields
    const requestData = {
      userId,
      type,
      amount,
      carNumber,
      carModel: carModel || "",
      fuelType: fuelType || null,
      contactPhone,
      driverName: driverName || "",
      driverPhone: driverPhone || "",
      driverEmail: driverEmail || "",
      interest: interest ?? 0,
      totalRepayable: totalRepayable ?? amount,
      interestRate: interestRate ?? 13,
      repaymentDays: repaymentDays ?? 7,
      dailyPayment: dailyPayment ?? toMoney((amount * 1.13) / 7),
      package: packageName || null,
      packageDescription: packageDescription || null,
      status: "pending",
      requestDate: new Date(),
      createdAt: new Date(),
      hasReceipt: hasReceipt || false,
    };

    console.log("Saving request data:", requestData);

    const result = await serviceRequestsCollection.insertOne(requestData);
    const requestId = result.insertedId.toString();

    // Update driver's total requests count and send notification
    try {
      // Find the user to get push token
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      
      if (user?.expoPushToken) {
        await sendPushNotification(
          user.expoPushToken,
          "Request Submitted",
          `Your ${type} request of R${amount} has been submitted successfully.`,
          { screen: "Requests" }
        );
      }

      await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $inc: { totalRequests: 1 } },
      );

      const driverProfilesCollection = db.collection("driverProfiles");
      await driverProfilesCollection.updateOne(
        { userId: userId },
        { $inc: { totalRequests: 1, totalSpent: toMoney(amount) } },
        { upsert: true },
      );
    } catch (updateError) {
      console.error("Error updating driver stats/notifications:", updateError);
    }

    // Send email notification to admin
    (async () => {
      try {
        await sendAdminNotificationEmail({
          requestId: requestId,
          driverName: driverName || "Unknown",
          driverEmail: driverEmail || "",
          driverPhone: driverPhone || "",
          carRegistration: carNumber,
          carModel: carModel,
          serviceType: type,
          amount: amount,
          phoneNumber: contactPhone,
          fuelType: fuelType,
          interest: interest,
          totalRepayable: totalRepayable,
          repaymentDays: repaymentDays,
          requestDate: new Date().toISOString(),
        });
        console.log("Admin notification email sent for request:", requestId);
      } catch (emailError) {
        console.error("Failed to send admin notification email:", emailError);
      }
    })();

    return NextResponse.json({
      success: true,
      requestId: requestId,
      message: "Request submitted successfully",
    });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 },
    );
  }
}
