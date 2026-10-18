import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, router } from "expo-router";
import { useCompanyStore } from "@/lib/company";
import { listAccounts, type AccountRow } from "@/lib/accounts";

export default function AccountsListScreen() {
  const companyId = useCompanyStore((s) => s.selectedId);
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [mine, setMine] = useState(false);
  const [q, setQ] = useState("");
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
      const res = await listAccounts(companyId, { mine });
      setRows(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [companyId, mine]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (a) =>
        a.name.toLowerCase().includes(needle) ||
        (a.tags ?? "").toLowerCase().includes(needle) ||
        (a.industry ?? "").toLowerCase().includes(needle) ||
        (a.accountTypeName ?? "").toLowerCase().includes(needle) ||
        (a.accountGroupName ?? "").toLowerCase().includes(needle),
    );
  }, [rows, q]);

  return (
    <>
      <Stack.Screen options={{ title: "Accounts" }} />
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Search name / type / tags"
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />
        <View style={styles.chips}>
          <Pressable
            onPress={() => setMine(false)}
            style={[styles.chip, !mine && styles.chipOn]}
          >
            <Text>All</Text>
          </Pressable>
          <Pressable
            onPress={() => setMine(true)}
            style={[styles.chip, mine && styles.chipOn]}
          >
            <Text>My accounts</Text>
          </Pressable>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(a) => a.id}
            ListEmptyComponent={
              <Text style={styles.sub}>No accounts found.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/accounts/${item.id}`)}
              >
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {[item.accountTypeName, item.accountGroupName, item.industry]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                  {item.tags ? ` · ${item.tags}` : ""}
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
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  chips: { flexDirection: "row", gap: 8, marginBottom: 8 },
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
  name: { fontSize: 16, fontWeight: "500" },
  sub: { opacity: 0.6, marginTop: 2, fontSize: 13 },
  error: { color: "#b00020", marginBottom: 8 },
});
