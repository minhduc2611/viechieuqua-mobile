import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  FlatList,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCompanyStore } from "@/lib/company";
import {
  addDays,
  createHour,
  deleteHour,
  listProjects,
  listTasks,
  listWeekHours,
  todayIso,
  updateHour,
  weekBalance,
  weekRange,
  type HourRow,
  type ProjectOpt,
  type TaskOpt,
} from "@/lib/hours";
import {
  discardTimer,
  formatElapsed,
  getActiveTimer,
  startTimer,
  stopTimer,
  type Timer,
} from "@/lib/timers";

function statusLabel(s: number) {
  if (s === -1) return "declined";
  if (s === 0) return "pending";
  if (s === 1) return "approved";
  return String(s);
}

export default function TodayScreen() {
  const companyId = useCompanyStore((s) => s.selectedId);
  const [rows, setRows] = useState<HourRow[]>([]);
  const [projects, setProjects] = useState<ProjectOpt[]>([]);
  const [tasks, setTasks] = useState<TaskOpt[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [hours, setHours] = useState("1");
  const [billable, setBillable] = useState(true);
  const [desc, setDesc] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const initialWeek = weekRange();
  const [filterFrom, setFilterFrom] = useState(initialWeek.from);
  const [filterTo, setFilterTo] = useState(initialWeek.to);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filterBillable, setFilterBillable] = useState<boolean | null>(null);
  const [filterStatus, setFilterStatus] = useState<number | null>(null);
  const [balance, setBalance] = useState<{
    target: string;
    tracked: string;
    balance: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState<Timer | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(async () => {
    if (!companyId) {
      setError("Pick a company in More");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [h, p, b, t] = await Promise.all([
        listWeekHours(companyId, {
          from: filterFrom,
          to: filterTo,
          projectId: filterProjectId,
          billable: filterBillable,
          status: filterStatus,
        }),
        listProjects(companyId),
        weekBalance(companyId, filterFrom).catch(() => null),
        getActiveTimer(companyId).catch(() => null),
      ]);
      setRows(h.data ?? []);
      setProjects(p);
      setBalance(b);
      setTimer(t);
      setProjectId((cur) => cur ?? p[0]?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [companyId, filterFrom, filterTo, filterProjectId, filterBillable, filterStatus]);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Live elapsed from startedAt (survives background — no local counter state).
  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [timer?.id]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && companyId) {
        void getActiveTimer(companyId)
          .then(setTimer)
          .catch(() => undefined);
      }
    });
    return () => sub.remove();
  }, [companyId]);

  // `tick` only triggers re-render; elapsed is always from startedAt.
  const elapsedSec = timer
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000),
      )
    : 0;
  void tick;

  function shiftWeek(delta: number) {
    const nextFrom = addDays(filterFrom, delta * 7);
    setFilterFrom(nextFrom);
    setFilterTo(addDays(nextFrom, 6));
  }

  useEffect(() => {
    if (!companyId || !projectId) {
      setTasks([]);
      setTaskId(null);
      return;
    }
    void listTasks(companyId, projectId)
      .then((t) => {
        setTasks(t);
        setTaskId((cur) =>
          cur && t.some((x) => x.id === cur) ? cur : (t[0]?.id ?? null),
        );
      })
      .catch(() => {
        setTasks([]);
        setTaskId(null);
      });
  }, [companyId, projectId]);

  function startEdit(item: HourRow) {
    setEditId(item.id);
    setProjectId(item.projectId);
    setTaskId(item.taskId);
    setHours(String(item.hours));
    setBillable(item.billable);
    setDesc(item.description ?? "");
  }

  function cancelEdit() {
    setEditId(null);
    setHours("1");
    setDesc("");
    setBillable(true);
  }

  async function submit() {
    if (!companyId || !projectId) return;
    const n = Number(hours);
    if (!n || n <= 0 || n > 24) {
      setError("Hours must be 0–24");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editId) {
        await updateHour(companyId, editId, {
          projectId,
          taskId: taskId,
          hours: n,
          description: desc.trim() || null,
          billable,
        });
        cancelEdit();
      } else {
        await createHour(companyId, {
          projectId,
          taskId: taskId ?? undefined,
          date: todayIso(),
          hours: n,
          description: desc.trim() || undefined,
          billable,
        });
        setDesc("");
      }
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onStartTimer() {
    if (!companyId || !projectId) return;
    setSaving(true);
    setError(null);
    try {
      const t = await startTimer(companyId, {
        projectId,
        taskId: taskId ?? undefined,
        description: desc.trim() || undefined,
        billable,
      });
      setTimer(t);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onStopTimer() {
    if (!companyId || !timer) return;
    setSaving(true);
    setError(null);
    try {
      await stopTimer(companyId, {
        description: desc.trim() || timer.description,
      });
      setTimer(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function onDiscardTimer() {
    if (!companyId || !timer) return;
    Alert.alert("Discard timer?", "Elapsed time will not be saved.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await discardTimer(companyId);
              setTimer(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          })();
        },
      },
    ]);
  }

  function confirmDelete(item: HourRow) {
    if (!companyId) return;
    Alert.alert("Delete entry?", `${item.date} · ${item.hours}h`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await deleteHour(companyId, item.id);
              if (editId === item.id) cancelEdit();
              await reload();
            } catch (e) {
              setError(e instanceof Error ? e.message : String(e));
            }
          })();
        },
      },
    ]);
  }

  if (loading && !rows.length) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Today</Text>
      <View style={styles.weekNav}>
        <Pressable onPress={() => shiftWeek(-1)} hitSlop={8}>
          <Text style={styles.navBtn}>‹</Text>
        </Pressable>
        <Text style={styles.sub}>
          {filterFrom} → {filterTo}
          {balance
            ? ` · ${balance.tracked}/${balance.target}h (Δ ${balance.balance})`
            : ""}
        </Text>
        <Pressable onPress={() => shiftWeek(1)} hitSlop={8}>
          <Text style={styles.navBtn}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>Project</Text>
      <View style={styles.chips}>
        {projects.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setProjectId(p.id)}
            style={[styles.chip, projectId === p.id && styles.chipOn]}
          >
            <Text numberOfLines={1}>{p.name}</Text>
          </Pressable>
        ))}
      </View>

      {tasks.length > 0 && (
        <>
          <Text style={styles.label}>Task</Text>
          <View style={styles.chips}>
            {tasks.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTaskId(t.id)}
                style={[styles.chip, taskId === t.id && styles.chipOn]}
              >
                <Text numberOfLines={1}>{t.title}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          keyboardType="decimal-pad"
          value={hours}
          onChangeText={setHours}
          placeholder="Hours"
        />
        <View style={styles.billable}>
          <Text>Billable</Text>
          <Switch value={billable} onValueChange={setBillable} />
        </View>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Description (optional)"
        value={desc}
        onChangeText={setDesc}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, { flex: 1 }]}
          onPress={submit}
          disabled={saving || !projectId}
        >
          <Text style={styles.btnText}>
            {saving ? "Saving…" : editId ? "Save" : "Log time"}
          </Text>
        </Pressable>
        {editId && (
          <Pressable style={styles.cancel} onPress={cancelEdit}>
            <Text>Cancel</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.timerBox}>
        {timer ? (
          <>
            <Text style={styles.timerClock}>{formatElapsed(elapsedSec)}</Text>
            <Text style={styles.hourSub} numberOfLines={1}>
              {projects.find((p) => p.id === timer.projectId)?.name ??
                timer.projectId}
              {timer.billable ? "" : " · internal"}
            </Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.btn, { flex: 1, backgroundColor: "#b00020" }]}
                onPress={onStopTimer}
                disabled={saving}
              >
                <Text style={styles.btnText}>Stop → hours</Text>
              </Pressable>
              <Pressable style={styles.cancel} onPress={onDiscardTimer}>
                <Text>Discard</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <Pressable
            style={[styles.btn, { backgroundColor: "#166534" }]}
            onPress={onStartTimer}
            disabled={saving || !projectId || !!editId}
          >
            <Text style={styles.btnText}>Start timer</Text>
          </Pressable>
        )}
      </View>

      <Text style={[styles.label, { marginTop: 20 }]}>Hours list</Text>
      <View style={styles.chips}>
        <Pressable
          onPress={() => setFilterProjectId(null)}
          style={[styles.chip, !filterProjectId && styles.chipOn]}
        >
          <Text>All projects</Text>
        </Pressable>
        {projects.slice(0, 8).map((p) => (
          <Pressable
            key={`f-${p.id}`}
            onPress={() => setFilterProjectId(p.id)}
            style={[styles.chip, filterProjectId === p.id && styles.chipOn]}
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
            onPress={() => setFilterBillable(v)}
            style={[styles.chip, filterBillable === v && styles.chipOn]}
          >
            <Text>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.chips}>
        {(
          [
            [null, "Any status"],
            [0, "Pending"],
            [1, "Approved"],
            [-1, "Declined"],
          ] as const
        ).map(([v, label]) => (
          <Pressable
            key={label}
            onPress={() => setFilterStatus(v)}
            style={[styles.chip, filterStatus === v && styles.chipOn]}
          >
            <Text>{label}</Text>
          </Pressable>
        ))}
      </View>
      {!rows.length ? (
        <Text style={styles.sub}>{loading ? "Loading…" : "No hours match filters."}</Text>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(h) => h.id}
          style={{ flex: 1 }}
          renderItem={({ item }) => {
            const pname =
              projects.find((p) => p.id === item.projectId)?.name ?? item.projectId;
            return (
              <View style={styles.hourRow}>
                <Pressable style={{ flex: 1 }} onPress={() => startEdit(item)}>
                  <Text style={styles.hourMain}>
                    {item.date} · {item.hours}h
                    {item.billable ? "" : " · internal"}
                    {` · ${statusLabel(item.status)}`}
                    {editId === item.id ? " · editing" : ""}
                  </Text>
                  <Text style={styles.hourSub} numberOfLines={1}>
                    {pname}
                    {item.description ? ` — ${item.description}` : ""}
                  </Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                  <Text style={styles.del}>Delete</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "600" },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  navBtn: { fontSize: 22, paddingHorizontal: 4 },
  sub: { flex: 1, opacity: 0.6 },
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
  row: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 10 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  billable: { flexDirection: "row", alignItems: "center", gap: 8 },
  btn: {
    marginTop: 12,
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancel: {
    marginTop: 12,
    padding: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  error: { color: "#b00020", marginTop: 8 },
  hourRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hourMain: { fontWeight: "500" },
  hourSub: { opacity: 0.6, marginTop: 2, fontSize: 13 },
  del: { color: "#b00020", fontSize: 13 },
  timerBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  timerClock: { fontSize: 28, fontWeight: "700", fontVariant: ["tabular-nums"] },
});
