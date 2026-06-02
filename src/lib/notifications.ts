import { Expo } from "expo-server-sdk";

const expo = new Expo();

export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Invalid Expo push token: ${pushToken}`);
    return;
  }

  const message = {
    to: pushToken,
    sound: "default",
    title,
    body,
    data,
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log("Push notification ticket:", ticket);
    return ticket;
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}

export async function sendAdminPushNotification(
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  try {
    const { connectToDatabase } = await import("@/lib/db");
    const { db } = await connectToDatabase();
    const adminUsers = await db
      .collection("user")
      .find({ role: "admin", expoPushToken: { $exists: true, $ne: null } })
      .toArray();

    const messages = adminUsers
      .filter((u: any) => Expo.isExpoPushToken(u.expoPushToken))
      .map((u: any) => ({
        to: u.expoPushToken,
        sound: "default" as const,
        title,
        body,
        data,
      }));

    if (messages.length > 0) {
      const tickets = await expo.sendPushNotificationsAsync(messages);
      console.log(`Admin push notifications sent (${messages.length}):`, tickets);
    }
  } catch (error) {
    console.error("Error sending admin push notification:", error);
  }
}
