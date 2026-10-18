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
import {
  displayName,
  listContacts,
  type ContactRow,
} from "@/lib/contacts";

export default function ContactsListScreen() {
  const companyId = useCompanyStore((s) => s.selectedId);
  const [rows, setRows] = useState<ContactRow[]>([]);
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
      const res = await listContacts(companyId);
      setRows(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((c) => {
      const blob = [c.firstName, c.lastName, c.email, c.phone, c.title]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [rows, q]);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Contacts",
          headerRight: () => (
            <Pressable onPress={() => router.push("/contacts/new")} hitSlop={8}>
              <Text style={styles.link}>New</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <TextInput
          style={styles.input}
          placeholder="Search"
          value={q}
          onChangeText={setQ}
          autoCapitalize="none"
        />
        {error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(c) => c.id}
            ListEmptyComponent={
              <Text style={styles.sub}>No contacts yet.</Text>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.row}
                onPress={() => router.push(`/contacts/${item.id}`)}
              >
                <Text style={styles.name}>{displayName(item)}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {[item.title, item.email, item.phone]
                    .filter(Boolean)
                    .join(" · ") || "—"}
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
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  name: { fontSize: 16, fontWeight: "500" },
  sub: { opacity: 0.6, marginTop: 2, fontSize: 13 },
  link: { color: "#2563eb", fontWeight: "600", marginRight: 8 },
  error: { color: "#b00020", marginBottom: 8 },
});
