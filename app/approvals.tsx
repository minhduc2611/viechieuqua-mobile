import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { useCompanyStore } from "@/lib/company";
import { listMembers } from "@/lib/tasks";
import { listProjects } from "@/lib/hours";
import {
  isManagerRole,
  listPendingHours,
  setHoursStatus,
} from "@/lib/approvals";
import type { HourRow } from "@/lib/hours";

type Pending = HourRow & { userId: string };

export default function ApprovalsScreen() {
  const { selectedId: companyId, companies } = useCompanyStore();
  const role = companies.find((c) => c.id === companyId)?.role;
  const [rows, setRows] = useState<Pending[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [projects, setProjects] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!companyId) {
      setError("Pick a company in More");
      setLoading(false);
      return;
    }
    if (!isManagerRole(role)) {
      setError("Managers only");
      setLoading(false);
      setRows([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [h, m, p] = await Promise.all([
        listPendingHours(companyId),
        listMembers(companyId),
        listProjects(companyId),
      ]);
      setRows(h.data ?? []);
      setNames(new Map(m.map((u) => [u.userId, u.name || u.email])));
      setProjects(new Map(p.map((x) => [x.id, x.name])));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [companyId, role]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function decide(id: string, status: 1 | -1) {
    if (!companyId) return;
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== id));
    try {
      await setHoursStatus(companyId, id, status);
    } catch (e) {
      setRows(prev);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Approvals" }} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error && !rows.length ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : !rows.length ? (
        <View style={styles.center}>
          <Text style={styles.sub}>No pending hours.</Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={rows}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={
            error ? <Text style={styles.error}>{error}</Text> : undefined
          }
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.main}>
                {item.date} · {item.hours}h
              </Text>
              <Text style={styles.sub}>
                {names.get(item.userId) ?? item.userId} ·{" "}
                {projects.get(item.projectId) ?? item.projectId}
              </Text>
              {item.description ? (
                <Text style={styles.sub} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  style={[styles.btn, styles.approve]}
                  onPress={() => void decide(item.id, 1)}
                >
                  <Text style={styles.btnText}>Approve</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.decline]}
                  onPress={() => void decide(item.id, -1)}
                >
                  <Text style={styles.btnText}>Decline</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  list: { padding: 16 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  main: { fontWeight: "600", fontSize: 16 },
  sub: { opacity: 0.6, marginTop: 2, fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginTop: 10 },
  btn: { flex: 1, padding: 10, borderRadius: 8, alignItems: "center" },
  approve: { backgroundColor: "#166534" },
  decline: { backgroundColor: "#b00020" },
  btnText: { color: "#fff", fontWeight: "600" },
  error: { color: "#b00020", marginBottom: 8 },
});
