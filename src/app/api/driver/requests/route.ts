// src/app/api/driver/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { sendAdminNotificationEmail } from "@/lib/email";

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
    const serviceRequestsCollection = db.collection("serviceRequests");

    const requests = await serviceRequestsCollection
      .find({ userId })
      .sort({ requestDate: -1 })
      .toArray();

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}

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
      contactPhone, // Changed from phoneNumber to contactPhone
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
    } = body;

    // Validate required fields
    if (!userId || !type || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: userId, type, or amount" },
        { status: 400 },
      );
    }

    // Validate phone number
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

    // Prepare request data with all fields
    const requestData = {
      userId,
      type,
      amount,
      carNumber,
      carModel: carModel || "",
      fuelType: fuelType || null,
      contactPhone, // Save the contact phone number
      driverName: driverName || "",
      driverPhone: driverPhone || "",
      driverEmail: driverEmail || "",
      interest: interest || 0,
      totalRepayable: totalRepayable || amount,
      interestRate: interestRate || 13,
      repaymentDays: repaymentDays || 7,
      dailyPayment: dailyPayment || Math.ceil((amount * 1.13) / 7),
      package: packageName || null,
      packageDescription: packageDescription || null,
      status: "pending",
      requestDate: new Date(),
      createdAt: new Date(),
    };

    console.log("Saving request data:", requestData);

    const result = await serviceRequestsCollection.insertOne(requestData);
    const requestId = result.insertedId.toString();

    // Update driver's total requests count
    try {
      const usersCollection = db.collection("user");
      await usersCollection.updateOne(
        { _id: userId },
        { $inc: { totalRequests: 1 } },
      );

      const driverProfilesCollection = db.collection("driverProfiles");
      await driverProfilesCollection.updateOne(
        { userId: userId },
        { $inc: { totalRequests: 1, totalSpent: amount } },
      );
    } catch (updateError) {
      console.error("Error updating driver stats:", updateError);
      // Don't fail the request if stats update fails
    }

    // Send email notification to admin (don't await to avoid blocking response)
    // Run in background
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
        // Don't fail the request if email fails
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
