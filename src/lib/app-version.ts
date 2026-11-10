import { ANDROID_APK_URL } from "./app-download";

export type AppVersionInfo = {
  latestVersion: string;
  minSupportedVersion: string;
  apkUrl: string;
  releaseNotes: string;
  forceUpdate: boolean;
};

const LATEST_VERSION = process.env.KAPUKA_APP_VERSION ?? "1.0.1";

/**
 * Source of truth for the mobile update prompt. Release ritual:
 * 1. Bump `expo.version` + `android.versionCode` in the mobile app and build.
 * 2. Upload the APK to a GitHub Release on Kummirai/refuel named `kapuka.apk`.
 * 3. Set KAPUKA_APP_VERSION (and KAPUKA_RELEASE_NOTES / KAPUKA_FORCE_UPDATE)
 *    in Vercel, or edit the defaults below.
 */
export const APP_VERSION: AppVersionInfo = {
  latestVersion: LATEST_VERSION,
  minSupportedVersion:
    process.env.KAPUKA_MIN_SUPPORTED_VERSION ?? LATEST_VERSION,
  apkUrl: process.env.KAPUKA_APK_URL ?? ANDROID_APK_URL,
  releaseNotes: process.env.KAPUKA_RELEASE_NOTES ?? "",
  forceUpdate: process.env.KAPUKA_FORCE_UPDATE === "true",
};
