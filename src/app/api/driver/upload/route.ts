// src/app/api/driver/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
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

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 20MB" },
        { status: 400 },
      );
    }

    const requestId = formData.get("requestId") as string;

    let folder = "kapuka/drivers";
    if (type === "drivingLicense") {
      folder = "kapuka/drivers/drivingLicense";
    } else if (type === "carRegistration") {
      folder = "kapuka/drivers/carRegistration";
    } else if (type === "profilePhoto") {
      folder = "kapuka/drivers/profilePhoto";
    } else if (type === "pop") {
      folder = `kapuka/pop/${requestId || "unknown"}`;
    } else if (type === "repayment") {
      folder = `kapuka/repayments/${requestId || "unknown"}`;
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
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

    return NextResponse.json({
      success: true,
      url: (result as any).secure_url,
      publicId: (result as any).public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
