import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const apkPath = path.join(
    process.cwd(),
    "kapuka-maui",
    "bin",
    "Debug",
    "net10.0-android",
    "com.kapuka.app-Signed.apk",
  );

  if (!fs.existsSync(apkPath)) {
    return NextResponse.json({ error: "APK not found" }, { status: 404 });
  }

  const apk = fs.readFileSync(apkPath);
  return new NextResponse(apk, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="kapuka-app.apk"',
    },
  });
}
