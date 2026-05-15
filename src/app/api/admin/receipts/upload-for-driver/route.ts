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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const requestId = formData.get("requestId") as string;
    const driverName = formData.get("driverName") as string;
    const driverEmail = formData.get("driverEmail") as string;
    const driverPhone = formData.get("driverPhone") as string;
    const carNumber = formData.get("carNumber") as string;
    const actualAmount = formData.get("actualAmount") as string;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!driverName) {
      return NextResponse.json({ error: "Driver name is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 },
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 20MB" },
        { status: 400 },
      );
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

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");
    const driverProfilesCollection = db.collection("driverProfiles");
    const usersCollection = db.collection("user");

    const popUrl = (result as any).secure_url;
    const popPublicId = (result as any).public_id;
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
        }

        if (!existing.completedDate) {
          updateData.completedDate = new Date();
        }

        // If the request was pending or approved, mark it as completed
        if (existing.status === "pending" || existing.status === "approved" || existing.status === "sent") {
          updateData.status = "completed";
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
