import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { Readable } from "stream";
import { toMoney } from "@/lib/money";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function getBody(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await request.json();
    return {
      popUrl: body.popUrl || null,
      popPublicId: null,
      requestId: body.requestId || null,
      driverName: body.driverName || null,
      driverEmail: body.driverEmail || null,
      driverPhone: body.driverPhone || null,
      carNumber: body.carNumber || null,
      actualAmount: body.actualAmount || null,
      type: body.type || null,
    };
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (file) {
    if (!file.type.startsWith("image/")) {
      return { error: "File must be an image" };
    }

    if (file.size > 20 * 1024 * 1024) {
      return { error: "File size must be less than 20MB" };
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "kapuka/receipts/admin-upload",
          resource_type: "image",
          transformation: [
            { quality: "auto" },
            { fetch_format: "auto" },
            { width: 1920, crop: "limit" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      Readable.fromWeb(file.stream() as any).pipe(uploadStream);
    });

    return {
      popUrl: (result as any).secure_url,
      popPublicId: (result as any).public_id,
      requestId: (formData.get("requestId") as string) || null,
      driverName: (formData.get("driverName") as string) || null,
      driverEmail: (formData.get("driverEmail") as string) || null,
      driverPhone: (formData.get("driverPhone") as string) || null,
      carNumber: (formData.get("carNumber") as string) || null,
      actualAmount: (formData.get("actualAmount") as string) || null,
      type: (formData.get("type") as string) || null,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const data = await getBody(request);

    if (data?.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    if (!data || !data.popUrl) {
      return NextResponse.json({ error: "No receipt image provided" }, { status: 400 });
    }

    if (!data.driverName) {
      return NextResponse.json({ error: "Driver name is required" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const driverProfilesCollection = db.collection("driverProfiles");
    const usersCollection = db.collection("user");

    const { popUrl, popPublicId, requestId, driverName, driverEmail, driverPhone, carNumber, actualAmount, type } = data;
    const amount = actualAmount ? toMoney(parseFloat(actualAmount)) : 0;

    // Link to existing request
    if (requestId && ObjectId.isValid(requestId)) {
      const existing = await serviceRequestsCollection.findOne({
        _id: new ObjectId(requestId),
      });

      if (existing) {
        const updateData: Record<string, any> = {
          popUrl,
          popPublicId,
          popUploadedAt: new Date(),
          updatedAt: new Date(),
          uploadedByAdmin: true,
          hasReceipt: true,
          receiptStatus: "verified",
          receiptVerifiedAt: new Date(),
          driverName: driverName || existing.driverName,
          driverEmail: driverEmail || existing.driverEmail,
          driverPhone: driverPhone || existing.driverPhone,
          carNumber: carNumber || existing.carNumber,
        };

        if (amount > 0) {
          updateData.actualAmount = amount;

          const interestRate = existing.interestRate ?? 13;
          const repaymentDays = existing.repaymentDays ?? 7;
          const totalRepayable = toMoney(amount * (1 + interestRate / 100));
          const interestAmount = toMoney(totalRepayable - amount);

          updateData.totalRepayable = totalRepayable;
          updateData.interest = interestAmount;
          updateData.interestRate = interestRate;
          updateData.dailyPayment = toMoney(totalRepayable / repaymentDays);
          updateData.remainingBalance = totalRepayable;
          updateData.isPaid = false;
        }

        if (!existing.completedDate) {
          updateData.completedDate = new Date();
        }

        // If the request was pending or approved, mark it as completed
        if (existing.status === "pending" || existing.status === "approved" || existing.status === "sent") {
          updateData.status = "completed";
        }

        // Clear manager refuel flag so it shows in completed tab, not refueled
        if (existing.refueledByManager) {
          updateData.refueledByManager = false;
        }

        await serviceRequestsCollection.updateOne(
          { _id: new ObjectId(requestId) },
          { $set: updateData },
        );

        // Update driver profile stats
        const userId = existing.userId;
        if (userId && typeof userId === "string") {
          const actualAmountVal = amount > 0 ? amount : (existing.actualAmount || existing.amount || 0);
          await driverProfilesCollection.updateOne(
            { userId },
            {
              $inc: { totalSpent: actualAmountVal },
              $set: { updatedAt: new Date() },
            },
            { upsert: true },
          );

          await usersCollection.updateOne(
            { _id: userId },
            { $inc: { totalSpent: actualAmountVal, totalRequests: 1 } },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Receipt uploaded and linked to existing request. The driver can now see the receipt pending verification.",
          url: popUrl,
          requestId,
        });
      }
    }

    // Fallback: create a new request entry (shouldn't normally happen since UI requires request selection)
    const insertData: Record<string, any> = {
      type: type || "fuel",
      amount: amount || 0,
      actualAmount: amount || 0,
      carNumber: carNumber || "",
      driverName: driverName || "",
      driverEmail: driverEmail || "",
      driverPhone: driverPhone || "",
      popUrl,
      popPublicId,
      popUploadedAt: new Date(),
      uploadedByAdmin: true,
      status: "completed",
      completedDate: new Date(),
      hasReceipt: true,
      receiptStatus: "verified",
      receiptVerifiedAt: new Date(),
      requestDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (amount > 0) {
      const interestRate = 13;
      const repaymentDays = 7;
      const totalRepayable = toMoney(amount * (1 + interestRate / 100));
      const interestAmount = toMoney(totalRepayable - amount);
      insertData.totalRepayable = totalRepayable;
      insertData.interest = interestAmount;
      insertData.interestRate = interestRate;
      insertData.dailyPayment = toMoney(totalRepayable / repaymentDays);
      insertData.remainingBalance = totalRepayable;
      insertData.isPaid = false;
    }

    const insertResult = await serviceRequestsCollection.insertOne(insertData);

    return NextResponse.json({
      success: true,
      message: "Receipt uploaded successfully",
      url: popUrl,
      requestId: insertResult.insertedId.toString(),
    });
  } catch (error) {
    console.error("Admin upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload receipt" },
      { status: 500 },
    );
  }
}
