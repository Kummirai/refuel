// src/app/api/driver/requests/pop/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/lib/mongodb/client";
import { ObjectId } from "mongodb";
import { toMoney } from "@/lib/money";
import { sendPushNotification } from "@/lib/notifications";
import {
  sendAdminReceiptUploadEmail,
  sendDriverReceiptUploadConfirmation,
  sendDriverInvoiceEmail,
} from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    console.log("POP API called");

    // Verify user is authenticated
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      console.log("No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User authenticated:", session.user.id);

    const body = await request.json();
    console.log("Received body:", JSON.stringify(body, null, 2));

    const {
      requestId,
      actualAmount,
      popUrl,
      popPublicId,
      interest,
      totalRepayable,
      dailyPayment,
      repaymentDays,
    } = body;

    // Validate required fields
    if (!requestId) {
      console.log("Missing requestId");
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    if (!actualAmount || actualAmount <= 0) {
      console.log("Missing or invalid actualAmount");
      return NextResponse.json(
        { error: "Missing or invalid actual amount" },
        { status: 400 },
      );
    }

    if (!popUrl) {
      console.log("Missing popUrl");
      return NextResponse.json({ error: "Missing popUrl" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const requestsCollection = db.collection("serviceRequests");
    const usersCollection = db.collection("user");

    // Find the request
    const existingRequest = await requestsCollection.findOne({
      _id: new ObjectId(requestId),
      userId: session.user.id,
    });

    if (!existingRequest) {
      console.log("Request not found:", requestId);
      return NextResponse.json(
        { error: `Request ${requestId} not found` },
        { status: 404 },
      );
    }

    console.log("Found request:", existingRequest);

    // Calculate total repayable if interest is provided
    const finalTotalRepayable =
      totalRepayable ??
      (interest
        ? toMoney(actualAmount + (actualAmount * interest) / 100)
        : actualAmount);
    const finalDailyPayment = dailyPayment ?? toMoney(finalTotalRepayable / 7);
    const finalRepaymentDays = repaymentDays ?? 7;

    // Update the request
    const updateResult = await requestsCollection.updateOne(
      {
        _id: new ObjectId(requestId),
        userId: session.user.id,
      },
      {
        $set: {
          actualAmount: actualAmount,
          popUrl: popUrl,
          popPublicId: popPublicId || `pop_${requestId}_${Date.now()}`,
          popUploadedAt: new Date(),
          interest: interest ?? (existingRequest.type === "cash" ? 15 : 0),
          totalRepayable: finalTotalRepayable,
          dailyPayment: finalDailyPayment,
          repaymentDays: finalRepaymentDays,
          status: "completed",
          remainingBalance: finalTotalRepayable,
          isPaid: false,
          completedDate: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    console.log("Update result:", updateResult);

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update request" },
        { status: 500 },
      );
    }

    // Update user's total spent
    const driverProfilesCollection = db.collection("driverProfiles");
    await driverProfilesCollection.updateOne(
      { userId: session.user.id },
      {
        $inc: { totalSpent: toMoney(actualAmount), totalRequests: 1 },
        $set: { updatedAt: new Date() },
      },
      { upsert: true },
    );

    // Get driver details for email/notifications
    const user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });

    // Trigger push notification if token exists
    if (user?.expoPushToken) {
      await sendPushNotification(
        user.expoPushToken,
        "Receipt Uploaded",
        "Your receipt has been uploaded successfully and is pending verification.",
        { screen: "History" }
      );
    }

    // Type-safe service type mapping
    const serviceTypeMap: Record<string, string> = {
      fuel: "Fuel",
      airtime: "Airtime",
      cash: "Cash Loan",
      carwash: "Car Wash",
    };

    const serviceTypeLabel =
      serviceTypeMap[existingRequest.type] || existingRequest.type;

    // Send email to admin about receipt upload (don't await - fire and forget)
    sendAdminReceiptUploadEmail({
      driverName: user?.name || session.user.name || "Driver",
      driverEmail: user?.email || session.user.email || "",
      driverPhone: user?.phone || existingRequest.phoneNumber || "Not provided",
      carRegistration: existingRequest.carNumber || "Unknown",
      serviceType: existingRequest.type,
      serviceTypeLabel: serviceTypeLabel,
      amount: existingRequest.amount,
      actualAmount: actualAmount,
      totalRepayable: finalTotalRepayable,
      popUrl: popUrl,
      uploadedAt: new Date().toISOString(),
      requestId: requestId,
    }).catch((err) =>
      console.error("Failed to send admin receipt email:", err),
    );

    // Send confirmation email to driver (don't await - fire and forget)
    sendDriverReceiptUploadConfirmation({
      driverEmail: user?.email || session.user.email || "",
      driverName: user?.name || session.user.name || "Driver",
      carRegistration: existingRequest.carNumber || "Unknown",
      serviceTypeLabel: serviceTypeLabel,
      amount: existingRequest.amount,
      actualAmount: actualAmount,
      totalRepayable: finalTotalRepayable,
      uploadedAt: new Date().toISOString(),
      requestId: requestId,
    }).catch((err) =>
      console.error("Failed to send driver receipt confirmation:", err),
    );

    // Send invoice email to driver (don't await - fire and forget)
    const isCarWash = existingRequest.type === "carwash";
    const calculatedInterestAmount =
      existingRequest.type === "fuel" && interest
        ? toMoney(interest)
        : 0;
    const calculatedInterestRate =
      calculatedInterestAmount > 0 && actualAmount > 0
        ? Math.round((calculatedInterestAmount / actualAmount) * 100)
        : existingRequest.interestRate ?? 13;
    const carWashServiceCharge =
      isCarWash && actualAmount > existingRequest.amount
        ? toMoney(actualAmount - existingRequest.amount)
        : 0;

    sendDriverInvoiceEmail({
      driverEmail: user?.email || session.user.email || "",
      driverName: user?.name || session.user.name || "Driver",
      carRegistration: existingRequest.carNumber || "Unknown",
      carModel: existingRequest.carModel || undefined,
      serviceTypeLabel: serviceTypeLabel,
      requestId: requestId,
      invoiceDate: new Date().toISOString(),
      actualAmount: actualAmount,
      interestRate: calculatedInterestRate,
      interestAmount: calculatedInterestAmount > 0 ? calculatedInterestAmount : undefined,
      totalRepayable: finalTotalRepayable,
      dailyPayment: finalDailyPayment || undefined,
      repaymentDays: finalRepaymentDays || undefined,
      packageName: existingRequest.package || undefined,
      serviceCharge: carWashServiceCharge > 0 ? carWashServiceCharge : undefined,
      totalDue: isCarWash ? actualAmount : undefined,
    }).catch((err) =>
      console.error("Failed to send driver invoice email:", err),
    );

    console.log("Successfully updated profile and sent notifications");

    return NextResponse.json({
      success: true,
      message: "POP uploaded successfully",
      data: {
        actualAmount,
        totalRepayable: finalTotalRepayable,
        dailyPayment: finalDailyPayment,
      },
    });
  } catch (error: any) {
    console.error("POP upload error:", error);
    return NextResponse.json(
      { error: "Failed to process POP: " + error.message },
      { status: 500 },
    );
  }
}
