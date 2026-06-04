import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getManagerCycle } from "@/lib/utils/cycle";

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "approved" | "completed"
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const { startDate: cycleStart, endDate: cycleEnd } = await getManagerCycle(db, from, to);

    const query: any = {
      approvedDate: {
        $gte: cycleStart,
        $lte: cycleEnd,
      },
    };

    if (status) {
      if (status === "approved") {
        query.status = { $in: ["approved", "sent"] };
      } else if (status === "completed") {
        query.status = { $in: ["completed"] };
      }
    } else {
      query.status = { $in: ["approved", "sent", "completed"] };
    }

    const serviceRequestsCollection = db.collection("serviceRequests");
    const requests = await serviceRequestsCollection
      .find(query)
      .sort({ approvedDate: -1 })
      .toArray();

    const mapped = requests.map((req: any) => ({
      id: req._id.toString(),
      _id: req._id.toString(),
      userId: req.userId,
      type: req.type,
      amount: req.amount,
      actualAmount: req.actualAmount,
      carNumber: req.carNumber,
      carModel: req.carModel,
      driverName: req.driverName,
      driverPhone: req.driverPhone,
      driverEmail: req.driverEmail,
      status: req.status,
      otp: req.otp,
      refueledByManager: req.refueledByManager || false,
      requestDate: req.requestDate,
      approvedDate: req.approvedDate,
      completedDate: req.completedDate,
      interestRate: req.interestRate,
      interest: req.interest,
      totalRepayable: req.totalRepayable,
      fuelType: req.fuelType,
      contactPhone: req.contactPhone,
      popUrl: req.popUrl,
    }));

    const pending = mapped.filter((r: { status: string }) => r.status === "approved" || r.status === "sent");
    const completed = mapped.filter((r: { status: string }) => r.status === "completed");

    return NextResponse.json({
      requests: mapped,
      pending,
      completed,
      cycle: {
        startDate: cycleStart.toISOString(),
        endDate: cycleEnd.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching manager requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 },
    );
  }
}
