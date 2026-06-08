import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { sendDriverWeeklyInvoiceEmail } from "@/lib/email";
import { sendPushNotification } from "@/lib/notifications";
import { toMoney } from "@/lib/money";

export async function POST(request: Request) {
  try {
    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const repaymentProofsCollection = db.collection("repaymentProofs");
    const usersCollection = db.collection("user");

    const body = await request.json();
    const { email, startDate, endDate } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Find user
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user._id?.toString();
    if (!userId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    // 2. Calculate outstanding items for this user
    const userRequests = await serviceRequestsCollection
      .find({ userId, status: "completed" })
      .toArray();

    const items: {
      type: string;
      carNumber: string;
      amount: number;
      totalRepayable: number;
      remainingBalance: number;
      completedDate?: string;
    }[] = [];
    let totalOutstanding = 0;

    for (const req of userRequests) {
      if (req.isPaid) continue;

      const completedDate = req.completedDate
        ? new Date(req.completedDate)
        : null;

      if (startDate && completedDate && completedDate < new Date(startDate)) continue;
      if (endDate && completedDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        if (completedDate > endOfDay) continue;
      }

      const totalRepayable = req.totalRepayable || req.amount || 0;
      const requestId = req._id.toString();

      let remainingBalance: number;
      if (req.remainingBalance !== undefined) {
        remainingBalance = req.remainingBalance;
      } else {
        const approvedRepayments = await repaymentProofsCollection
          .find({ requestId, status: "approved" })
          .toArray();
        const totalRepaid = approvedRepayments.reduce(
          (sum: number, r: any) => sum + (r.amount || 0),
          0,
        );
        remainingBalance = Math.max(0, totalRepayable - totalRepaid);
      }
      remainingBalance = toMoney(remainingBalance);

      if (remainingBalance <= 0) continue;

      const originalAmount = req.actualAmount || req.amount || 0;
      const effectiveAmount =
        totalRepayable > 0
          ? toMoney(originalAmount * (remainingBalance / totalRepayable))
          : originalAmount;

      items.push({
        type: req.type,
        carNumber: req.carNumber || "Unknown",
        amount: effectiveAmount,
        totalRepayable: remainingBalance,
        remainingBalance,
        completedDate: req.completedDate
          ? new Date(req.completedDate).toISOString()
          : "",
      });
      totalOutstanding = toMoney(totalOutstanding + remainingBalance);
    }

    // 3. Send email
    if (items.length > 0) {
      try {
        await sendDriverWeeklyInvoiceEmail({
          driverEmail: email,
          driverName: user.name || user.displayName || "Driver",
          totalOutstanding,
          items,
        });
      } catch (err) {
        console.error(`Failed to send weekly invoice to ${email}:`, err);
      }
    }

    // 4. Send push notification
    const pushTokens = user?.pushTokens?.length ? user.pushTokens : user.expoPushToken ? [user.expoPushToken] : [];

    if (pushTokens.length) {
      await sendPushNotification(
        pushTokens,
        "New Invoice",
        items.length > 0
          ? `Your weekly invoice for R${totalOutstanding} is ready.`
          : "You have a new invoice notification.",
        { screen: "Invoices", params: { email: user.email } },
      );
    }

    // 5. Save history
    await db.collection("invoiceHistory").insertOne({
      channel: "email",
      sentAt: new Date(),
      singleRecipient: true,
      driverName: user.name || user.displayName || "Driver",
      driverEmail: email,
      totalOutstanding,
      totalDrivers: 1,
      sent: items.length > 0 ? 1 : 0,
      errors: items.length > 0 ? 0 : 1,
      items,
      drivers: [{
        driverName: user.name || user.displayName || "Driver",
        driverEmail: email,
        driverPhone: user.phone || "",
        outstanding: totalOutstanding,
        items,
      }],
    });

    return NextResponse.json({ success: true, message: "Invoice and notification processed" });
  } catch (error) {
    console.error("Error processing send-single invoice:", error);
    return NextResponse.json(
      { error: "Failed to process invoice" },
      { status: 500 },
    );
  }
}
