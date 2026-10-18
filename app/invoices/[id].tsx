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
import {
  getInvoice,
  invoiceStatusLabel,
  type Invoice,
} from "@/lib/finance";

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const companyId = useCompanyStore((s) => s.selectedId);
  const [inv, setInv] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!companyId || !id) {
        setError("Missing company or invoice");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const row = await getInvoice(companyId, id);
        if (!cancelled) setInv(row);
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
  if (error || !inv) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? "Not found"}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: inv.invoiceNumber }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{inv.invoiceNumber}</Text>
        <Text style={styles.sub}>
          {invoiceStatusLabel(inv.status)} · {inv.invoiceDate}
          {inv.dueDate ? ` · due ${inv.dueDate}` : ""}
        </Text>
        <Text style={styles.total}>
          {inv.grossTotal} {inv.currencyCode}
        </Text>
        <Text style={styles.meta}>
          Net {inv.netTotal} · VAT {inv.vatTotal}
        </Text>
        {inv.notes ? <Text style={styles.notes}>{inv.notes}</Text> : null}

        <Text style={styles.section}>Rows ({inv.rows?.length ?? 0})</Text>
        {(inv.rows ?? []).map((r) => (
          <View key={r.id} style={styles.row}>
            <Text style={styles.rowText}>{r.text || "—"}</Text>
            <Text style={styles.sub}>
              {r.quantity} × {r.unitPrice} = {r.grossTotal}
            </Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600" },
  sub: { opacity: 0.6, marginTop: 4, fontSize: 13 },
  total: { fontSize: 20, fontWeight: "700", marginTop: 12 },
  meta: { opacity: 0.6, marginTop: 4 },
  notes: { marginTop: 12, fontStyle: "italic" },
  section: { marginTop: 24, fontWeight: "600", marginBottom: 8 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  rowText: { fontWeight: "500" },
  error: { color: "#b00020", textAlign: "center" },
});
