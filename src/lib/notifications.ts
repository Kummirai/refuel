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
