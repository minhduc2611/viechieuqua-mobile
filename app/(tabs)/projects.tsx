import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { ApiError, request } from "@/lib/api";
import { useCompanyStore } from "@/lib/company";

interface Project {
  id: string;
  name: string;
  projectNumber: string | null;
}

export default function ProjectsScreen() {
  const companyId = useCompanyStore((s) => s.selectedId);
  const [rows, setRows] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!companyId) {
        setLoading(false);
        setError("Pick a company in More");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await request<{ data: Project[] } | Project[]>(
          "/api/projects?perPage=50",
          { companyId },
        );
        if (cancelled) return;
        setRows(Array.isArray(res) ? res : (res.data ?? []));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!rows.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.sub}>No projects yet.</Text>
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={rows}
      keyExtractor={(p) => p.id}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => router.push(`/project/${item.id}`)}
        >
          <Text style={styles.name}>{item.name}</Text>
          {item.projectNumber ? (
            <Text style={styles.sub}>#{item.projectNumber}</Text>
          ) : null}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  list: { padding: 16 },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ccc",
  },
  name: { fontSize: 16 },
  sub: { opacity: 0.6, marginTop: 2, fontSize: 13 },
  error: { color: "#b00020", textAlign: "center" },
});
