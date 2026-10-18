import { useCallback, useEffect, useMemo, useState } from "react";
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
import { addDays, listProjects, weekRange, type ProjectOpt } from "@/lib/hours";
import { listMembers, type MemberOpt } from "@/lib/tasks";
import {
  allocationWarnings,
  listAllocations,
  type AllocationRow,
  type AllocWarningUser,
} from "@/lib/allocations";

export default function PlanningScreen() {
  const companyId = useCompanyStore((s) => s.selectedId);
  const week = weekRange();
  const [from, setFrom] = useState(week.from);
  const [to, setTo] = useState(week.to);
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [warnings, setWarnings] = useState<AllocWarningUser[]>([]);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [members, setMembers] = useState<MemberOpt[]>([]);
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
      const [a, w, p, m] = await Promise.all([
        listAllocations(companyId, from, to),
        allocationWarnings(companyId, from, to),
        listProjects(companyId),
        listMembers(companyId),
      ]);
      setRows(a);
      setWarnings(w.users ?? []);
      setProjects(p);
      setMembers(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [companyId, from, to]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function shiftWeek(delta: number) {
    const next = addDays(from, delta * 7);
    setFrom(next);
    setTo(addDays(next, 6));
  }

  const projectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? id;

  const userName = (id: string) => {
    const m = members.find((x) => x.userId === id);
    return m?.name || m?.email || id.slice(0, 8);
  };

  const flagged = useMemo(
    () => warnings.filter((u) => u.status !== "ok"),
    [warnings],
  );

  return (
    <>
      <Stack.Screen options={{ title: "Planning" }} />
      <View style={styles.container}>
        <View style={styles.weekNav}>
          <Pressable onPress={() => shiftWeek(-1)}>
            <Text style={styles.navBtn}>‹</Text>
          </Pressable>
          <Text style={styles.sub}>
            {from} → {to}
          </Text>
          <Pressable onPress={() => shiftWeek(1)}>
            <Text style={styles.navBtn}>›</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {loading ? (
          <ActivityIndicator style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(r) => r.id}
            ListHeaderComponent={
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.section}>Load vs target</Text>
                {!flagged.length ? (
                  <Text style={styles.sub}>All users within target.</Text>
                ) : (
                  flagged.map((u) => (
                    <View key={u.userId} style={styles.warn}>
                      <Text style={styles.warnTitle}>
                        {u.name} · {u.status.toUpperCase()}
                      </Text>
                      <Text style={styles.sub}>
                        {u.allocated}/{u.target}h (Δ {u.balance})
                        {u.overloadedDays.length
                          ? ` · heavy: ${u.overloadedDays.slice(0, 3).join(", ")}`
                          : ""}
                      </Text>
                    </View>
                  ))
                )}
                <Text style={[styles.section, { marginTop: 16 }]}>
                  Allocations ({rows.length})
                </Text>
              </View>
            }
            ListEmptyComponent={
              <Text style={styles.sub}>No allocations this week.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.main}>
                  {userName(item.userId)} · {item.hours}h
                </Text>
                <Text style={styles.sub}>
                  {projectName(item.projectId)} · {item.startDate}→{item.endDate}
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
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  navBtn: { fontSize: 22, paddingHorizontal: 4 },
  section: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  warn: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  warnTitle: { fontWeight: "600" },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  main: { fontWeight: "500" },
  sub: { flex: 1, opacity: 0.6, fontSize: 13, marginTop: 2 },
  error: { color: "#b00020", marginBottom: 8 },
});
