// src/app/api/admin/receipts/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { sendDriverInvoiceEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";
import { toMoney } from "@/lib/money";

const serviceTypeMap: Record<string, string> = {
  fuel: "Fuel",
  airtime: "Airtime",
  cash: "Cash Loan",
  carwash: "Car Wash",
};

export async function POST(req: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const body = await req.json();
    const { requestId, action } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: "Request ID is required" },
        { status: 400 },
      );
    }

    const serviceRequestsCollection = db.collection("serviceRequests");

    let objectId;
    try {
      objectId = new ObjectId(requestId);
    } catch {
      return NextResponse.json(
        { error: "Invalid request ID format" },
        { status: 400 },
      );
    }

    if (action === "verify") {
      const result = await serviceRequestsCollection.updateOne(
        { _id: objectId },
        {
          $set: {
            hasReceipt: true,
            receiptVerifiedAt: new Date(),
            updatedAt: new Date(),
            refueledByManager: false,
          },
        },
      );

      if (result.modifiedCount === 0) {
        return NextResponse.json(
          { error: "Failed to verify receipt" },
          { status: 500 },
        );
      }

      const serviceRequest = await serviceRequestsCollection.findOne({
        _id: objectId,
      });

      if (serviceRequest) {
        const usersCollection = db.collection("user");
        let user;
        try {
          user = await usersCollection.findOne({
            _id: new ObjectId(serviceRequest.userId),
          });
        } catch {
          user = await usersCollection.findOne({ id: serviceRequest.userId });
        }

        // Trigger push notification if token exists
        if (user?.expoPushToken) {
            await sendPushNotification(
              user.expoPushToken,
              "Receipt Verified",
              "Your receipt has been verified and your invoice is ready.",
              { screen: "Invoices" }
            );
        }

        const driverEmail =
          serviceRequest.driverEmail || user?.email || "";
        const driverName =
          serviceRequest.driverName || user?.name || "Driver";
        const serviceTypeLabel =
          serviceTypeMap[serviceRequest.type] || serviceRequest.type;
        const actualAmount =
          serviceRequest.actualAmount ?? serviceRequest.amount;
        const totalRepayable =
          serviceRequest.totalRepayable ?? actualAmount;
        const interestAmount = serviceRequest.interest ?? 0;
        const interestRate = serviceRequest.interestRate ?? 13;
        const dailyPayment = serviceRequest.dailyPayment ?? 0;
        const repaymentDays = serviceRequest.repaymentDays ?? 7;
        const isCarWash = serviceRequest.type === "carwash";
        const carWashServiceCharge =
          isCarWash && actualAmount > serviceRequest.amount
            ? toMoney(actualAmount - serviceRequest.amount)
            : 0;

        if (driverEmail) {
          sendDriverInvoiceEmail({
            driverEmail,
            driverName,
            carRegistration: serviceRequest.carNumber || "Unknown",
            carModel: serviceRequest.carModel || undefined,
            serviceTypeLabel,
            requestId,
            invoiceDate: new Date().toISOString(),
            actualAmount,
            interestRate: interestAmount > 0 ? interestRate : undefined,
            interestAmount: interestAmount > 0 ? interestAmount : undefined,
            totalRepayable,
            dailyPayment: dailyPayment > 0 ? dailyPayment : undefined,
            repaymentDays: repaymentDays > 0 ? repaymentDays : undefined,
            packageName: serviceRequest.package || undefined,
            serviceCharge:
              carWashServiceCharge > 0 ? carWashServiceCharge : undefined,
            totalDue: isCarWash ? actualAmount : undefined,
          }).catch((err) =>
            console.error("Failed to send invoice email:", err),
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: "Receipt verified successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error verifying receipt:", error);
    return NextResponse.json(
      { error: "Failed to verify receipt" },
      { status: 500 },
    );
  }
}
