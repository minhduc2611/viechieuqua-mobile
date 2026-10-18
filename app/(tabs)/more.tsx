import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { getSessionUser, signOut } from "@/lib/auth";
import { useCompanyStore } from "@/lib/company";
import { isManagerRole } from "@/lib/approvals";
import { registerPushToken } from "@/lib/push";

export default function MoreScreen() {
  const { companies, selectedId, setSelectedId, loadCompanies } = useCompanyStore();
  const [email, setEmail] = useState<string | null>(null);
  const [pushNote, setPushNote] = useState<string | null>(null);
  const role = companies.find((c) => c.id === selectedId)?.role;

  useEffect(() => {
    void loadCompanies().catch(() => undefined);
    void getSessionUser().then((u) => setEmail(u?.email ?? null));
  }, [loadCompanies]);

  useEffect(() => {
    if (!selectedId) return;
    void registerPushToken(selectedId)
      .then((t) => setPushNote(t ? "Push token registered" : "Push unavailable (sim/permission)"))
      .catch(() => setPushNote("Push register failed"));
  }, [selectedId]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Signed in</Text>
      <Text style={styles.value}>{email ?? "—"}</Text>
      {pushNote ? <Text style={styles.sub}>{pushNote}</Text> : null}

      <Text style={[styles.label, { marginTop: 24 }]}>Company</Text>
      {companies.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => setSelectedId(c.id)}
          style={[styles.company, selectedId === c.id && styles.companyOn]}
        >
          <Text>{c.name}</Text>
          <Text style={styles.role}>{c.role}</Text>
        </Pressable>
      ))}
      {!companies.length && (
        <Text style={styles.sub}>No companies — create one on web first.</Text>
      )}

      <Pressable
        style={styles.linkBtn}
        onPress={() => router.push("/accounts")}
      >
        <Text style={styles.linkText}>Accounts</Text>
      </Pressable>
      <Pressable
        style={styles.linkBtn}
        onPress={() => router.push("/contacts")}
      >
        <Text style={styles.linkText}>Contacts</Text>
      </Pressable>
      <Pressable
        style={styles.linkBtn}
        onPress={() => router.push("/planning")}
      >
        <Text style={styles.linkText}>Planning</Text>
      </Pressable>
      <Pressable
        style={styles.linkBtn}
        onPress={() => router.push("/invoices")}
      >
        <Text style={styles.linkText}>Invoices</Text>
      </Pressable>
      <Pressable
        style={styles.linkBtn}
        onPress={() => router.push("/costs")}
      >
        <Text style={styles.linkText}>Costs</Text>
      </Pressable>

      {isManagerRole(role) && (
        <>
          <Pressable
            style={styles.linkBtn}
            onPress={() => router.push("/approvals")}
          >
            <Text style={styles.linkText}>Approvals</Text>
          </Pressable>
          <Pressable
            style={styles.linkBtn}
            onPress={() => router.push("/team-hours")}
          >
            <Text style={styles.linkText}>Team hours</Text>
          </Pressable>
        </>
      )}

      <Pressable
        style={styles.out}
        onPress={async () => {
          await signOut();
          router.replace("/login");
        }}
      >
        <Text style={styles.outText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  label: { fontSize: 12, opacity: 0.5, textTransform: "uppercase" },
  value: { fontSize: 16, marginTop: 4 },
  company: {
    padding: 12,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  companyOn: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  role: { opacity: 0.5, fontSize: 12 },
  sub: { marginTop: 8, opacity: 0.6 },
  linkBtn: {
    marginTop: 24,
    padding: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  linkText: { fontWeight: "600" },
  out: {
    marginTop: 32,
    padding: 14,
    backgroundColor: "#111",
    borderRadius: 8,
    alignItems: "center",
  },
  outText: { color: "#fff", fontWeight: "600" },
});
