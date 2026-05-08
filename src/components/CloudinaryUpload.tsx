// src/components/CloudinaryUpload.tsx
"use client";

import { CldUploadWidget } from "next-cloudinary";
import { useState, useEffect } from "react";
import { Camera, Loader2, X, Eye } from "lucide-react";
import type { CloudinaryUploadWidgetInfo } from "next-cloudinary";

interface CloudinaryUploadProps {
  onUploadComplete: (url: string, publicId: string) => void;
  onDelete?: (publicId: string) => void;
  currentUrl?: string;
  currentPublicId?: string;
  label: string;
  type: string;
}

const UPLOAD_PRESET = "driver_documents";

export function CloudinaryUpload({
  onUploadComplete,
  onDelete,
  currentUrl,
  currentPublicId,
  label,
  type,
}: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUrl || null,
  );
  const [publicId, setPublicId] = useState<string | null>(
    currentPublicId || null,
  );
  const [isMounted, setIsMounted] = useState(false);
  const [cloudName, setCloudName] = useState<string>("");

  useEffect(() => {
    setIsMounted(true);
    // Get cloud name from environment variable
    const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (name) {
      setCloudName(name);
    } else {
      console.error("Cloudinary cloud name is not configured!");
    }
  }, []);

  const handleDelete = async () => {
    if (!publicId) return;

    if (!confirm("Are you sure you want to delete this image?")) return;

    try {
      const response = await fetch("/api/cloudinary/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });

      if (response.ok) {
        setPreviewUrl(null);
        setPublicId(null);
        if (onDelete) onDelete(publicId);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Don't render widget on server
  if (!isMounted) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-[#01312D]">
          {label}
        </label>
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-500">Loading uploader...</p>
        </div>
      </div>
    );
  }

  // Show error if cloud name missing
  if (!cloudName) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-[#01312D]">
          {label}
        </label>
        <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
          <p className="text-sm text-red-600">
            Cloudinary is not configured. Please add
            NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to .env.local
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-[#01312D]">
        {label}
      </label>

      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt={label}
            className="w-32 h-32 object-cover rounded-lg border-2 border-[#bff202]/20"
          />
          <button
            onClick={handleDelete}
            type="button"
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.open(previewUrl, "_blank")}
            type="button"
            className="absolute -bottom-2 -right-2 bg-[#3A7717] text-white rounded-full p-1 hover:bg-[#2d5a12] transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )}

      <CldUploadWidget
        uploadPreset={UPLOAD_PRESET}
        options={{
          cloudName: cloudName,
          maxFileSize: 10485760,
          clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
          folder: `kapuka/drivers/${type}`,
          cropping: true,
          croppingAspectRatio: 1,
          showAdvancedOptions: false,
          multiple: false,
          sources: ["local", "camera"],
        }}
        onSuccess={(result) => {
          const info = result.info as CloudinaryUploadWidgetInfo;
          if (info) {
            console.log("Upload success:", info);
            setPreviewUrl(info.secure_url);
            setPublicId(info.public_id);
            onUploadComplete(info.secure_url, info.public_id);
          }
          setUploading(false);
        }}
        onError={(error) => {
          console.error("Upload error:", error);
          setUploading(false);
          alert("Upload failed. Please try again.");
        }}
        onQueuesStart={() => {
          setUploading(true);
        }}
      >
        {({ open }) => (
          <button
            onClick={() => open && open()}
            disabled={uploading}
            type="button"
            className="bg-[#3A7717] text-white px-4 py-2 rounded-lg hover:bg-[#2d5a12] transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                {previewUrl ? "Change Image" : "Upload Image"}
              </>
            )}
          </button>
        )}
      </CldUploadWidget>

      <p className="text-xs text-gray-500">
        Max file size: 5MB. Allowed formats: JPG, PNG, WebP
      </p>
    </div>
  );
}
