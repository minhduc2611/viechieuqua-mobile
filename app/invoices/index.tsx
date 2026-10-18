import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { useCompanyStore } from "@/lib/company";
import {
  invoiceStatusLabel,
  listInvoices,
  type Invoice,
} from "@/lib/finance";

export default function InvoicesListScreen() {
  const companyId = useCompanyStore((s) => s.selectedId);
  const [rows, setRows] = useState<Invoice[]>([]);
  const [status, setStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) {
      setError("Pick a company in More");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await listInvoices(
        companyId,
        status === null ? undefined : status,
      );
      setRows(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [companyId, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <>
      <Stack.Screen options={{ title: "Invoices" }} />
      <View style={styles.container}>
        <View style={styles.chips}>
          {(
            [
              [null, "All"],
              [0, "Draft"],
              [1, "Sent"],
              [2, "Paid"],
            ] as const
          ).map(([v, label]) => (
            <Pressable
              key={label}
              onPress={() => setStatus(v)}
              style={[styles.chip, status === v && styles.chipOn]}
            >
              <Text>{label}</Text>
            </Pressable>
          ))}
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(i) => i.id}
            ListEmptyComponent={
              <Text style={styles.sub}>No invoices found.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/invoices/${item.id}`)}
              >
                <Text style={styles.main}>
                  {item.invoiceNumber} · {invoiceStatusLabel(item.status)}
                </Text>
                <Text style={styles.sub}>
                  {item.invoiceDate} · {item.grossTotal} {item.currencyCode}
                </Text>
              </Pressable>
            )}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  chipOn: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  main: { fontWeight: "500", fontSize: 16 },
  sub: { opacity: 0.6, marginTop: 2, fontSize: 13 },
  error: { color: "#b00020", marginBottom: 8 },
});
