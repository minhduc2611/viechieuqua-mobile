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
import { isManagerRole } from "@/lib/approvals";
import { listMembers, type MemberOpt } from "@/lib/tasks";
import {
  addDays,
  listProjects,
  listWeekHours,
  weekRange,
  type HourRow,
  type ProjectOpt,
} from "@/lib/hours";

function statusLabel(s: number) {
  if (s === -1) return "declined";
  if (s === 0) return "pending";
  if (s === 1) return "approved";
  return String(s);
}

export default function TeamHoursScreen() {
  const { selectedId: companyId, companies } = useCompanyStore();
  const role = companies.find((c) => c.id === companyId)?.role;
  const week = weekRange();
  const [from, setFrom] = useState(week.from);
  const [to, setTo] = useState(week.to);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [billable, setBillable] = useState<boolean | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [rows, setRows] = useState<HourRow[]>([]);
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
    if (!isManagerRole(role)) {
      setError("Managers only");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [h, p, m] = await Promise.all([
        listWeekHours(companyId, {
          from,
          to,
          projectId,
          userId,
          billable,
          status,
        }),
        listProjects(companyId),
        listMembers(companyId),
      ]);
      setRows(h.data ?? []);
      setProjects(p);
      setMembers(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [companyId, role, from, to, projectId, userId, billable, status]);

  useEffect(() => {
    void reload();
  }, [reload]);

  function shiftWeek(delta: number) {
    const next = addDays(from, delta * 7);
    setFrom(next);
    setTo(addDays(next, 6));
  }

  function nameOf(uid?: string) {
    if (!uid) return "—";
    const m = members.find((x) => x.userId === uid);
    return m?.name || m?.email || uid.slice(0, 8);
  }

  return (
    <>
      <Stack.Screen options={{ title: "Team hours" }} />
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

        <Text style={styles.label}>Person</Text>
        <View style={styles.chips}>
          <Pressable
            onPress={() => setUserId(null)}
            style={[styles.chip, !userId && styles.chipOn]}
          >
            <Text>All</Text>
          </Pressable>
          {members.slice(0, 10).map((m) => (
            <Pressable
              key={m.userId}
              onPress={() => setUserId(m.userId)}
              style={[styles.chip, userId === m.userId && styles.chipOn]}
            >
              <Text numberOfLines={1}>{m.name || m.email}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Project</Text>
        <View style={styles.chips}>
          <Pressable
            onPress={() => setProjectId(null)}
            style={[styles.chip, !projectId && styles.chipOn]}
          >
            <Text>All</Text>
          </Pressable>
          {projects.slice(0, 8).map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setProjectId(p.id)}
              style={[styles.chip, projectId === p.id && styles.chipOn]}
            >
              <Text numberOfLines={1}>{p.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.chips}>
          {(
            [
              [null, "All"],
              [true, "Billable"],
              [false, "Internal"],
            ] as const
          ).map(([v, label]) => (
            <Pressable
              key={label}
              onPress={() => setBillable(v)}
              style={[styles.chip, billable === v && styles.chipOn]}
            >
              <Text>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.chips}>
          {(
            [
              [null, "Any"],
              [0, "Pending"],
              [1, "Approved"],
              [-1, "Declined"],
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
            style={{ flex: 1 }}
            data={rows}
            keyExtractor={(r) => r.id}
            ListEmptyComponent={
              <Text style={styles.sub}>No hours match filters.</Text>
            }
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.main}>
                  {item.date} · {item.hours}h · {statusLabel(item.status)}
                </Text>
                <Text style={styles.sub}>
                  {nameOf(item.userId)} ·{" "}
                  {projects.find((p) => p.id === item.projectId)?.name ??
                    item.projectId}
                  {item.billable ? "" : " · internal"}
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
  label: { fontSize: 12, opacity: 0.5, textTransform: "uppercase", marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    maxWidth: "100%",
  },
  chipOn: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  main: { fontWeight: "500" },
  sub: { flex: 1, opacity: 0.6, fontSize: 13, marginTop: 2 },
  error: { color: "#b00020", marginTop: 8 },
});
