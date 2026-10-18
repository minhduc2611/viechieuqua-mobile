import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { ApiError, request } from "@/lib/api";
import { useCompanyStore } from "@/lib/company";
import {
  listMembers,
  listProjectTasks,
  listTaskStatuses,
  updateTask,
  type MemberOpt,
  type TaskRow,
  type TaskStatus,
} from "@/lib/tasks";

interface Project {
  id: string;
  name: string;
  projectNumber: string | null;
  projectValue: string;
  billingType: string | null;
  startDate: string | null;
  endDate: string | null;
  projectTypeName: string | null;
  projectCategoryName: string | null;
  statusReasonName: string | null;
  userTeamName: string | null;
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const companyId = useCompanyStore((s) => s.selectedId);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [statuses, setStatuses] = useState<TaskStatus[]>([]);
  const [members, setMembers] = useState<MemberOpt[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editPriority, setEditPriority] = useState(3);
  const [editAssignee, setEditAssignee] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadTasks = useCallback(async () => {
    if (!companyId || !id) return;
    const [t, s, m] = await Promise.all([
      listProjectTasks(companyId, id),
      listTaskStatuses(companyId),
      listMembers(companyId).catch(() => [] as MemberOpt[]),
    ]);
    setTasks(t);
    setStatuses([...s].sort((a, b) => a.orderNr - b.orderNr));
    setMembers(m);
  }, [companyId, id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!companyId || !id) {
        setLoading(false);
        setError("Missing company or project");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const p = await request<Project>(`/api/projects/${id}`, { companyId });
        if (cancelled) return;
        setProject(p);
        await reloadTasks();
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
  }, [companyId, id, reloadTasks]);

  function startRename(task: TaskRow) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDue(task.dueDate ?? "");
    setEditPriority(task.priority || 3);
    setEditAssignee(task.assigneeUserId);
  }

  async function saveRename() {
    if (!companyId || !editingId) return;
    const title = editTitle.trim();
    if (!title) return;
    const due = editDue.trim();
    if (due && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
      setError("Due date must be YYYY-MM-DD");
      return;
    }
    try {
      await updateTask(companyId, editingId, {
        title,
        dueDate: due || null,
        priority: editPriority,
        assigneeUserId: editAssignee,
      });
      setEditingId(null);
      await reloadTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function pickAssignee() {
    Alert.alert("Assignee", undefined, [
      {
        text: "Unassigned",
        onPress: () => setEditAssignee(null),
      },
      ...members.slice(0, 6).map((m) => ({
        text: m.name || m.email,
        onPress: () => setEditAssignee(m.userId),
      })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  }

  function memberName(userId: string | null) {
    if (!userId) return null;
    const m = members.find((x) => x.userId === userId);
    return m?.name || m?.email || userId.slice(0, 8);
  }

  function changeStatus(task: TaskRow) {
    if (!companyId || !statuses.length) return;
    Alert.alert(
      "Status",
      task.title,
      [
        ...statuses.map((s) => ({
          text: s.key === task.status ? `✓ ${s.name}` : s.name,
          onPress: () => {
            if (s.key === task.status) return;
            void (async () => {
              try {
                await updateTask(companyId, task.id, { status: s.key });
                await reloadTasks();
              } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
              }
            })();
          },
        })),
        { text: "Cancel", style: "cancel" },
      ],
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error && !project) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Not found</Text>
      </View>
    );
  }

  const byStatus = statuses.map((s) => ({
    status: s,
    tasks: tasks.filter((t) => t.status === s.key),
  }));
  const orphan = tasks.filter((t) => !statuses.some((s) => s.key === t.status));

  return (
    <>
      <Stack.Screen options={{ title: project.name }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{project.name}</Text>
        <Field label="Number" value={project.projectNumber} />
        <Field label="Type" value={project.projectTypeName} />
        <Field label="Category" value={project.projectCategoryName} />
        <Field label="Team" value={project.userTeamName} />
        <Field label="Billing" value={project.billingType} />
        <Field label="Value" value={project.projectValue} />
        <Field label="Start" value={project.startDate} />
        <Field label="End" value={project.endDate} />
        <Field label="Status" value={project.statusReasonName} />
        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={[styles.section, { marginTop: 24 }]}>
          Tasks ({tasks.length})
        </Text>
        <Text style={styles.hint}>
          Tap to edit title/due/priority/assignee · long-press for status
        </Text>

        {byStatus.map(({ status, tasks: col }) => (
          <View key={status.key} style={styles.column}>
            <View style={styles.colHead}>
              <View style={[styles.dot, { backgroundColor: status.color }]} />
              <Text style={styles.colTitle}>
                {status.name} ({col.length})
              </Text>
            </View>
            {!col.length ? (
              <Text style={styles.sub}>Empty</Text>
            ) : (
              col.map((t) => (
                <View key={t.id} style={styles.task}>
                  {editingId === t.id ? (
                    <View style={styles.editBlock}>
                      <TextInput
                        style={styles.input}
                        value={editTitle}
                        onChangeText={setEditTitle}
                        placeholder="Title"
                        autoFocus
                      />
                      <TextInput
                        style={styles.input}
                        value={editDue}
                        onChangeText={setEditDue}
                        placeholder="Due YYYY-MM-DD"
                        autoCapitalize="none"
                      />
                      <View style={styles.prioRow}>
                        {[1, 2, 3, 4, 5].map((p) => (
                          <Pressable
                            key={p}
                            onPress={() => setEditPriority(p)}
                            style={[
                              styles.prioChip,
                              editPriority === p && styles.prioOn,
                            ]}
                          >
                            <Text>P{p}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <Pressable onPress={pickAssignee} style={styles.assigneeBtn}>
                        <Text>
                          Assignee:{" "}
                          {editAssignee
                            ? memberName(editAssignee)
                            : "Unassigned"}
                        </Text>
                      </Pressable>
                      <View style={styles.editRow}>
                        <Pressable onPress={saveRename}>
                          <Text style={styles.link}>Save</Text>
                        </Pressable>
                        <Pressable onPress={() => setEditingId(null)}>
                          <Text style={styles.sub}>Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => startRename(t)}
                      onLongPress={() => changeStatus(t)}
                    >
                      <Text style={styles.taskTitle}>{t.title}</Text>
                      <Text style={styles.sub}>
                        P{t.priority}
                        {t.dueDate ? ` · due ${t.dueDate}` : ""}
                        {t.assigneeUserId
                          ? ` · ${memberName(t.assigneeUserId)}`
                          : ""}
                      </Text>
                    </Pressable>
                  )}
                </View>
              ))
            )}
          </View>
        ))}

        {orphan.length > 0 && (
          <View style={styles.column}>
            <Text style={styles.colTitle}>Other ({orphan.length})</Text>
            {orphan.map((t) => (
              <Pressable
                key={t.id}
                style={styles.task}
                onPress={() => startRename(t)}
                onLongPress={() => changeStatus(t)}
              >
                <Text>{t.title}</Text>
                <Text style={styles.sub}>
                  {t.status} · P{t.priority}
                  {t.dueDate ? ` · due ${t.dueDate}` : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 12 },
  field: { marginTop: 10 },
  label: { fontSize: 12, opacity: 0.5, textTransform: "uppercase" },
  value: { fontSize: 16, marginTop: 2 },
  section: { fontSize: 16, fontWeight: "600" },
  hint: { opacity: 0.5, fontSize: 12, marginTop: 4, marginBottom: 8 },
  column: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
  },
  colHead: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  colTitle: { fontWeight: "600" },
  task: {
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#eee",
  },
  taskTitle: { fontSize: 15 },
  editBlock: { gap: 8 },
  editRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 8,
  },
  prioRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  prioChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  prioOn: { borderColor: "#2563eb", backgroundColor: "#eff6ff" },
  assigneeBtn: {
    padding: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  link: { color: "#2563eb", fontWeight: "600" },
  sub: { opacity: 0.6, marginTop: 2, fontSize: 13 },
  error: { color: "#b00020", marginTop: 8 },
});
