import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCompanyStore } from "@/lib/company";
import { getAccount, type AccountRow } from "@/lib/accounts";
import { listMembers } from "@/lib/tasks";

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function addr(
  a?: AccountRow["billing"],
): string | null {
  if (!a) return null;
  const line = [a.street, [a.zip, a.city].filter(Boolean).join(" "), a.country]
    .filter(Boolean)
    .join(", ");
  return line || null;
}

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const companyId = useCompanyStore((s) => s.selectedId);
  const [account, setAccount] = useState<AccountRow | null>(null);
  const [managerNames, setManagerNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!companyId || !id) {
        setError("Missing company or account");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [a, members] = await Promise.all([
          getAccount(companyId, id),
          listMembers(companyId).catch(() => []),
        ]);
        if (cancelled) return;
        setAccount(a);
        setManagerNames(
          (a.managerIds ?? [])
            .map((uid) => {
              const m = members.find((x) => x.userId === uid);
              return m?.name || m?.email || uid.slice(0, 8);
            })
            .filter(Boolean),
        );
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId, id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error || !account) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: account.name }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{account.name}</Text>
        <Field label="Type" value={account.accountTypeName} />
        <Field label="Group" value={account.accountGroupName} />
        <Field label="Industry" value={account.industry} />
        <Field label="Tags" value={account.tags} />
        <Field label="VAT" value={account.vatId} />
        <Field
          label="Status"
          value={account.status === 0 ? "Active" : `Status ${account.status}`}
        />
        <Field label="Managers" value={managerNames.join(", ") || null} />
        <Field label="Billing" value={addr(account.billing)} />
        <Field label="Visiting" value={addr(account.visiting)} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 12 },
  field: { marginTop: 10 },
  label: { fontSize: 12, opacity: 0.5, textTransform: "uppercase" },
  value: { fontSize: 16, marginTop: 2 },
  error: { color: "#b00020", textAlign: "center" },
});
