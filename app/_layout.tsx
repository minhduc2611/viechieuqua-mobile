import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/components/useColorScheme";
import { getSessionToken } from "@/lib/session";
import { getSessionUser } from "@/lib/auth";
import { useCompanyStore } from "@/lib/company";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  anchor: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [ready, setReady] = useState(false);
  const loadCompanies = useCompanyStore((s) => s.loadCompanies);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      const token = await getSessionToken();
      if (token) {
        const user = await getSessionUser();
        if (user) {
          await loadCompanies().catch(() => undefined);
          router.replace("/(tabs)");
        } else {
          router.replace("/login");
        }
      } else {
        router.replace("/login");
      }
      setReady(true);
      await SplashScreen.hideAsync();
    })();
  }, [loaded, loadCompanies]);

  if (!loaded || !ready) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="project/[id]" options={{ title: "Project" }} />
        <Stack.Screen name="approvals" options={{ title: "Approvals" }} />
        <Stack.Screen name="team-hours" options={{ title: "Team hours" }} />
        <Stack.Screen name="accounts/index" options={{ title: "Accounts" }} />
        <Stack.Screen name="accounts/[id]" options={{ title: "Account" }} />
        <Stack.Screen name="contacts/index" options={{ title: "Contacts" }} />
        <Stack.Screen name="contacts/new" options={{ title: "New contact" }} />
        <Stack.Screen name="contacts/[id]" options={{ title: "Contact" }} />
        <Stack.Screen name="planning" options={{ title: "Planning" }} />
        <Stack.Screen name="invoices/index" options={{ title: "Invoices" }} />
        <Stack.Screen name="invoices/[id]" options={{ title: "Invoice" }} />
        <Stack.Screen name="costs" options={{ title: "Costs" }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
}
