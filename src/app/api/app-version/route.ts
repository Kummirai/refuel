import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const LATEST_VERSION = "1.0.0";
const PROD_APK_URL = process.env.KAPUKA_APK_URL || "";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const currentVersion = searchParams.get("currentVersion") || "0.0.0";

  const updateAvailable = compareVersions(currentVersion, LATEST_VERSION) < 0;
  if (!updateAvailable) {
    return NextResponse.json({ updateAvailable: false, latestVersion: LATEST_VERSION, apkUrl: null });
  }

  // Local dev: serve the APK from the build output
  const localApk = path.join(
    process.cwd(),
    "kapuka-maui",
    "bin",
    "Debug",
    "net10.0-android",
    "com.kapuka.app-Signed.apk",
  );
  const apkUrl = fs.existsSync(localApk)
    ? `${new URL(request.url).origin}/api/app-version/apk`
    : PROD_APK_URL;

  return NextResponse.json({
    updateAvailable: true,
    latestVersion: LATEST_VERSION,
    apkUrl,
  });
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
