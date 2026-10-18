import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCompanyStore } from "@/lib/company";
import {
  displayName,
  getContact,
  updateContact,
  type ContactRow,
} from "@/lib/contacts";

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const companyId = useCompanyStore((s) => s.selectedId);
  const [contact, setContact] = useState<ContactRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!companyId || !id) {
        setError("Missing company or contact");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const c = await getContact(companyId, id);
        if (cancelled) return;
        setContact(c);
        setFirstName(c.firstName);
        setLastName(c.lastName ?? "");
        setEmail(c.email ?? "");
        setPhone(c.phone ?? "");
        setTitle(c.title ?? "");
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

  async function save() {
    if (!companyId || !id) return;
    if (!firstName.trim()) {
      setError("First name required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const c = await updateContact(companyId, id, {
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        title: title.trim() || undefined,
      });
      setContact(c);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }
  if (error && !contact) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }
  if (!contact) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: displayName(contact),
          headerRight: () =>
            editing ? null : (
              <Pressable onPress={() => setEditing(true)} hitSlop={8}>
                <Text style={styles.link}>Edit</Text>
              </Pressable>
            ),
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        {editing ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="First name *"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Last name"
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={styles.input}
              placeholder="Title"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.row}>
              <Pressable
                style={[styles.btn, { flex: 1 }]}
                onPress={save}
                disabled={saving}
              >
                <Text style={styles.btnText}>{saving ? "Saving…" : "Save"}</Text>
              </Pressable>
              <Pressable
                style={styles.cancel}
                onPress={() => {
                  setEditing(false);
                  setFirstName(contact.firstName);
                  setLastName(contact.lastName ?? "");
                  setEmail(contact.email ?? "");
                  setPhone(contact.phone ?? "");
                  setTitle(contact.title ?? "");
                }}
              >
                <Text>Cancel</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>{displayName(contact)}</Text>
            {contact.title ? <Text style={styles.sub}>{contact.title}</Text> : null}
            <Field label="Email" value={contact.email} />
            <Field label="Phone" value={contact.phone} />
          </>
        )}
      </ScrollView>
    </>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600" },
  sub: { opacity: 0.6, marginTop: 4, marginBottom: 8 },
  field: { marginTop: 12 },
  label: { fontSize: 12, opacity: 0.5, textTransform: "uppercase" },
  value: { fontSize: 16, marginTop: 2 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 12, marginTop: 8, alignItems: "center" },
  btn: {
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600" },
  cancel: {
    padding: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ccc",
  },
  link: { color: "#2563eb", fontWeight: "600", marginRight: 8 },
  error: { color: "#b00020", marginBottom: 8 },
});
