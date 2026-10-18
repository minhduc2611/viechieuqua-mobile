import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { signIn, signUp } from "@/lib/auth";
import { useCompanyStore } from "@/lib/company";

export default function LoginScreen() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loadCompanies = useCompanyStore((s) => s.loadCompanies);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") await signUp(email.trim(), password, name.trim() || email);
      else await signIn(email.trim(), password);
      await loadCompanies().catch(() => undefined);
      router.replace("/(tabs)");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === "in" ? "Sign in" : "Sign up"}</Text>
      {mode === "up" && (
        <TextInput
          style={styles.input}
          placeholder="Name"
          autoCapitalize="words"
          value={name}
          onChangeText={setName}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.btn} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Continue</Text>}
      </Pressable>
      <Pressable onPress={() => setMode(mode === "in" ? "up" : "in")}>
        <Text style={styles.switch}>
          {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "600" },
  switch: { marginTop: 16, textAlign: "center", color: "#2563eb" },
  error: { color: "#b00020", marginBottom: 8 },
});
