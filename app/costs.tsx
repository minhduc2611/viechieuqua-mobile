import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { useCompanyStore } from "@/lib/company";
import { listProjects, type ProjectOpt } from "@/lib/hours";
import { listCosts, type CostRow } from "@/lib/finance";

export default function CostsScreen() {
  const companyId = useCompanyStore((s) => s.selectedId);
  const [rows, setRows] = useState<CostRow[]>([]);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
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
      const [c, p] = await Promise.all([
        listCosts(companyId),
        listProjects(companyId),
      ]);
      setRows(c.data ?? []);
      setProjects(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const projectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <Stack.Screen options={{ title: "Costs" }} />
      <View style={styles.container}>
        {error && <Text style={styles.error}>{error}</Text>}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            ListEmptyComponent={
              <Text style={styles.sub}>No costs yet.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.main}>
                  {item.date} · {item.amount}
                </Text>
                <Text style={styles.sub}>
                  {projectName(item.projectId)} · {item.type}
                  {item.description ? ` — ${item.description}` : ""}
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  main: { fontWeight: "500", fontSize: 16 },
  sub: { opacity: 0.6, marginTop: 2, fontSize: 13 },
  error: { color: "#b00020", marginBottom: 8 },
});
