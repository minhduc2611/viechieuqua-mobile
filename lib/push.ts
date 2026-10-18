import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { request } from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken(companyId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const req = await Notifications.requestPermissionsAsync();
    final = req.status;
  }
  if (final !== "granted") return null;

  // projectId optional until EAS project is linked
  const tokenRes = await Notifications.getExpoPushTokenAsync();
  const token = tokenRes.data;
  await request("/api/notifications/push-token", {
    method: "POST",
    companyId,
    body: JSON.stringify({
      token,
      platform: Platform.OS,
    }),
  });
  return token;
}
