import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "@/lib/mongodb/client";
import { ObjectId } from "mongodb";

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

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 },
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "kapuka/receipts/admin-upload",
          resource_type: "image",
          transformation: [{ quality: "auto" }, { fetch_format: "auto" }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(buffer);
    });

    const { db } = await connectToDatabase();
    const serviceRequestsCollection = db.collection("serviceRequests");

    const updateData: Record<string, any> = {
      popUrl: (result as any).secure_url,
      popPublicId: (result as any).public_id,
      popUploadedAt: new Date(),
      updatedAt: new Date(),
      uploadedByAdmin: true,
    };

    if (requestId && ObjectId.isValid(requestId)) {
      updateData.actualAmount = actualAmount ? parseFloat(actualAmount) : undefined;
      updateData.completedDate = new Date();
      updateData.hasReceipt = false;
      updateData.receiptStatus = "pending";

      const existing = await serviceRequestsCollection.findOne({
        _id: new ObjectId(requestId),
      });

      if (existing) {
        updateData.driverName = driverName || existing.driverName;
        updateData.driverEmail = driverEmail || existing.driverEmail;
        updateData.driverPhone = driverPhone || existing.driverPhone;
        updateData.carNumber = carNumber || existing.carNumber;

        await serviceRequestsCollection.updateOne(
          { _id: new ObjectId(requestId) },
          { $set: updateData },
        );

        return NextResponse.json({
          success: true,
          message: "Receipt uploaded successfully for existing request",
          url: (result as any).secure_url,
          requestId,
        });
      }
    }

    const insertData: Record<string, any> = {
      userId: `admin_upload_${Date.now()}`,
      type: type || "fuel",
      amount: actualAmount ? parseFloat(actualAmount) : 0,
      actualAmount: actualAmount ? parseFloat(actualAmount) : 0,
      carNumber: carNumber || "",
      driverName: driverName || "",
      driverEmail: driverEmail || "",
      driverPhone: driverPhone || "",
      popUrl: (result as any).secure_url,
      popPublicId: (result as any).public_id,
      popUploadedAt: new Date(),
      uploadedByAdmin: true,
      status: "completed",
      completedDate: new Date(),
      hasReceipt: false,
      receiptStatus: "pending",
      requestDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult = await serviceRequestsCollection.insertOne(insertData);

    return NextResponse.json({
      success: true,
      message: "Receipt uploaded successfully for driver",
      url: (result as any).secure_url,
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
