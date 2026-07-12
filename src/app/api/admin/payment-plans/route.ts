import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const paymentPlansCollection = db.collection("paymentPlans");
    const serviceRequestsCollection = db.collection("serviceRequests");

    const plans = await paymentPlansCollection
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    // Enrich each plan with current outstanding balance from serviceRequests
    const enrichedPlans = await Promise.all(
      plans.map(async (plan: any) => {
        const activeLoans = await serviceRequestsCollection
          .find({
            userId: plan.userId,
            status: { $in: ["approved", "completed"] },
            isPaid: { $ne: true },
          })
          .toArray();

        let currentOutstanding = 0;
        for (const loan of activeLoans) {
          const totalRepayable = loan.totalRepayable || loan.amount * 1.13;
          const repaid = loan.repaidAmount || 0;
          currentOutstanding += Math.max(0, totalRepayable - repaid);
        }

        // Update outstanding in the plan document if it changed
        if (Math.abs(currentOutstanding - (plan.outstandingBalance || 0)) > 0.01) {
          await paymentPlansCollection.updateOne(
            { _id: plan._id },
            { $set: { outstandingBalance: Math.round(currentOutstanding * 100) / 100 } },
          );
        }

        return {
          id: plan._id.toString(),
          userId: plan.userId,
          driverName: plan.driverName,
          driverEmail: plan.driverEmail,
          driverPhone: plan.driverPhone,
          outstandingBalance: Math.round(currentOutstanding * 100) / 100,
          installmentAmount: plan.installmentAmount,
          installmentDate: plan.installmentDate,
          totalPaid: plan.totalPaid || 0,
          isActive: plan.isActive,
          createdAt: plan.createdAt,
          updatedAt: plan.updatedAt,
          payments: (plan.payments || []).map((p: any) => ({
            amount: p.amount,
            date: p.date,
            method: p.method || "cash",
            note: p.note || "",
          })),
        };
      }),
    );

    return NextResponse.json(enrichedPlans);
  } catch (error) {
    console.error("Error fetching payment plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment plans" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, driverName, driverEmail, driverPhone, outstandingBalance, installmentAmount, installmentDate } = body;

    if (!userId || !installmentAmount || !installmentDate) {
      return NextResponse.json(
        { error: "Missing required fields: userId, installmentAmount, installmentDate" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const paymentPlansCollection = db.collection("paymentPlans");

    // Check if driver is already on an active payment plan
    const existing = await paymentPlansCollection.findOne({ userId, isActive: true });
    if (existing) {
      return NextResponse.json(
        { error: "This driver is already on an active payment plan" },
        { status: 409 },
      );
    }

    const plan = {
      userId,
      driverName: driverName || "",
      driverEmail: driverEmail || "",
      driverPhone: driverPhone || "",
      outstandingBalance: outstandingBalance || 0,
      installmentAmount,
      installmentDate,
      totalPaid: 0,
      isActive: true,
      payments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await paymentPlansCollection.insertOne(plan);

    return NextResponse.json({
      success: true,
      message: "Driver added to payment plan",
      planId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error creating payment plan:", error);
    return NextResponse.json(
      { error: "Failed to create payment plan" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, action, amount, method, note } = body;

    if (!planId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: planId, action" },
        { status: 400 },
      );
    }

    const { db } = await connectToDatabase();
    const paymentPlansCollection = db.collection("paymentPlans");

    if (action === "record-payment") {
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: "Invalid payment amount" },
          { status: 400 },
        );
      }

      const plan = await paymentPlansCollection.findOne({ _id: new ObjectId(planId) });
      if (!plan) {
        return NextResponse.json({ error: "Payment plan not found" }, { status: 404 });
      }

      const newTotalPaid = (plan.totalPaid || 0) + amount;
      const newOutstanding = Math.max(0, (plan.outstandingBalance || 0) - amount);
      const isFullyPaid = newOutstanding <= 0;

      await paymentPlansCollection.updateOne(
        { _id: new ObjectId(planId) },
        {
          $set: {
            totalPaid: Math.round(newTotalPaid * 100) / 100,
            outstandingBalance: Math.round(newOutstanding * 100) / 100,
            isActive: !isFullyPaid,
            updatedAt: new Date(),
          },
          $push: {
            payments: {
              amount,
              date: new Date(),
              method: method || "cash",
              note: note || "",
            },
          },
        },
      );

      return NextResponse.json({
        success: true,
        message: isFullyPaid ? "Payment plan fully paid" : "Payment recorded",
        outstandingBalance: Math.round(newOutstanding * 100) / 100,
        isFullyPaid,
      });
    }

    if (action === "remove") {
      await paymentPlansCollection.updateOne(
        { _id: new ObjectId(planId) },
        { $set: { isActive: false, updatedAt: new Date() } },
      );

      return NextResponse.json({
        success: true,
        message: "Driver removed from payment plan",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error updating payment plan:", error);
    return NextResponse.json(
      { error: "Failed to update payment plan" },
      { status: 500 },
    );
  }
}
