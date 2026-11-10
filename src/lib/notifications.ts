import { Expo } from "expo-server-sdk";

const expo = new Expo();

export async function sendPushNotification(
  pushTokenOrTokens: string | string[],
  title: string,
  body: string,
  data: Record<string, unknown> = {},
) {
  const tokens = Array.isArray(pushTokenOrTokens)
    ? pushTokenOrTokens
    : [pushTokenOrTokens];

  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));

  if (validTokens.length === 0) {
    console.error("No valid Expo push tokens provided");
    return;
  }

  const messages = validTokens.map((to) => ({
    to,
    sound: "default" as const,
    title,
    body,
    data,
  }));

  try {
    const ticket = await expo.sendPushNotificationsAsync(messages);
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
      .find({
        role: "admin",
        $or: [
          { "pushTokens.0": { $exists: true } },
          { expoPushToken: { $exists: true, $ne: null } },
        ],
      })
      .toArray();

    const allTokens = adminUsers.flatMap((u: any) =>
      u.pushTokens?.length ? u.pushTokens : u.expoPushToken ? [u.expoPushToken] : [],
    );

    const messages = allTokens
      .filter((t: string) => Expo.isExpoPushToken(t))
      .map((to: string) => ({
        to,
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
