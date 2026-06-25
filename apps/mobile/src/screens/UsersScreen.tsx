import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usersApi } from "../api";
import type { CreateUserPayload, UpdateUserPayload, UserSummary } from "../api/types";
import { colors, typography, radii } from "../theme";
import { useT } from "../i18n";
import { useAuth } from "../context/AuthContext";

/**
 * Admin-only user management screen.
 * Lists all users with their roles + sales counts, and lets admins
 * create/edit/delete accounts. Cashiers are blocked at the API level
 * (RolesGuard returns 403) but the screen also guards client-side
 * for a better UX.
 */
export function UsersScreen() {
  const t = useT();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UserSummary | null>(null);
  const [creating, setCreating] = useState(false);

  const isAdmin = currentUser?.role === "ADMIN";

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    try {
      const data = await usersApi.list();
      setUsers(data);
    } catch (err: any) {
      setError(err?.message ?? t.users.loadFailed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin, t.users.loadFailed]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleDelete = (u: UserSummary) => {
    Alert.alert(
      t.users.deleteConfirmTitle,
      t.users.deleteConfirmBody(u.name),
      [
        { text: t.users.cancel, style: "cancel" },
        {
          text: t.users.deleteConfirm,
          style: "destructive",
          onPress: async () => {
            try {
              await usersApi.remove(u.id);
              await load();
            } catch (err: any) {
              const msg = err?.message ?? t.users.deleteFailed;
              if (msg.toLowerCase().includes("last admin")) {
                Alert.alert(t.users.deleteConfirmTitle, t.users.lastAdminError);
              } else {
                Alert.alert(t.common.error, msg);
              }
            }
          },
        },
      ],
    );
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.center}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.lockTitle}>{t.users.title}</Text>
          <Text style={styles.lockBody}>{t.users.noPermission}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.lockBody}>{t.common.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const admins = users.filter((u) => u.role === "ADMIN");
  const cashiers = users.filter((u) => u.role === "CASHIER");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t.users.title}</Text>
          <Text style={styles.headerSubtitle}>{t.users.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setCreating(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnIcon}>+</Text>
          <Text style={styles.addBtnText}>{t.users.addUser}</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={load}>
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Admins section */}
        <Text style={styles.sectionTitle}>{t.roles.ADMIN} ({admins.length})</Text>
        <View style={styles.sectionList}>
          {admins.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              currentUserId={currentUser?.id}
              onEdit={() => setEditing(u)}
              onDelete={() => handleDelete(u)}
              t={t}
            />
          ))}
          {admins.length === 0 && <Text style={styles.emptyText}>{t.users.empty}</Text>}
        </View>

        {/* Cashiers section */}
        <Text style={styles.sectionTitle}>{t.roles.CASHIER} ({cashiers.length})</Text>
        <View style={styles.sectionList}>
          {cashiers.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              currentUserId={currentUser?.id}
              onEdit={() => setEditing(u)}
              onDelete={() => handleDelete(u)}
              t={t}
            />
          ))}
          {cashiers.length === 0 && <Text style={styles.emptyText}>{t.users.empty}</Text>}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <UserFormModal
        visible={creating || editing !== null}
        existing={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSaved={async () => {
          setCreating(false);
          setEditing(null);
          await load();
        }}
      />
    </SafeAreaView>
  );
}

/* ── User row ───────────────────────────────────────────────── */

function UserRow({
  user,
  currentUserId,
  onEdit,
  onDelete,
  t,
}: {
  user: UserSummary;
  currentUserId?: string;
  onEdit: () => void;
  onDelete: () => void;
  t: ReturnType<typeof useT>;
}) {
  const isCurrent = user.id === currentUserId;
  const isAdmin = user.role === "ADMIN";
  const salesCount = user._count?.salesCreated ?? 0;

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, isAdmin ? styles.avatarAdmin : styles.avatarCashier]}>
        <Text style={styles.avatarIcon}>{isAdmin ? "👑" : "💼"}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {isCurrent && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>{t.users.youLabel}</Text>
            </View>
          )}
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {user.email}
        </Text>
        <Text style={styles.meta}>
          {salesCount > 0 ? t.users.salesCount(salesCount) : t.users.neverSold}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onEdit}
          activeOpacity={0.6}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={onDelete}
          activeOpacity={0.6}
        >
          <Text style={[styles.actionIcon, { color: colors.danger }]}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Create / edit modal ────────────────────────────────────── */

function UserFormModal({
  visible,
  existing,
  onClose,
  onSaved,
}: {
  visible: boolean;
  existing: UserSummary | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const t = useT();
  const isEdit = existing !== null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "CASHIER">("CASHIER");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or the target user changes.
  useEffect(() => {
    if (visible) {
      setName(existing?.name ?? "");
      setEmail(existing?.email ?? "");
      setPassword("");
      setRole(existing?.role ?? "CASHIER");
      setError(null);
    }
  }, [visible, existing]);

  async function handleSave() {
    setError(null);

    if (!name.trim() || !email.trim() || (!isEdit && !password)) {
      setError(t.users.requiredFields);
      return;
    }
    if (password && password.length < 6) {
      setError(t.users.passwordTooShort);
      return;
    }

    setBusy(true);
    try {
      if (isEdit && existing) {
        const payload: UpdateUserPayload = {
          name: name.trim(),
          email: email.trim(),
          role,
          ...(password ? { password } : {}),
        };
        await usersApi.update(existing.id, payload);
      } else {
        const payload: CreateUserPayload = {
          name: name.trim(),
          email: email.trim(),
          password,
          role,
        };
        await usersApi.create(payload);
      }
      await onSaved();
    } catch (err: any) {
      const msg = err?.message ?? (isEdit ? t.users.updateFailed : t.users.createFailed);
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>
              {isEdit ? t.users.formTitle.edit : t.users.formTitle.create}
            </Text>

            <Text style={styles.fieldLabel}>{t.users.fields.name}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.users.placeholders.name}
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!busy}
            />

            <Text style={styles.fieldLabel}>{t.users.fields.email}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.users.placeholders.email}
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              editable={!busy}
            />

            <Text style={styles.fieldLabel}>{t.users.fields.password}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.users.placeholders.password}
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!busy}
            />
            <Text style={styles.passwordHint}>{t.users.fields.passwordHint}</Text>

            <Text style={styles.fieldLabel}>{t.users.fields.role}</Text>
            <View style={styles.rolePicker}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === "CASHIER" && styles.roleOptionActive,
                ]}
                onPress={() => setRole("CASHIER")}
                disabled={busy}
              >
                <Text style={styles.roleOptionIcon}>💼</Text>
                <Text
                  style={[
                    styles.roleOptionLabel,
                    role === "CASHIER" && styles.roleOptionLabelActive,
                  ]}
                >
                  {t.roles.CASHIER}
                </Text>
                <Text style={styles.roleOptionHint}>
                  {t.users.roles.CASHIER}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleOption,
                  role === "ADMIN" && styles.roleOptionActive,
                ]}
                onPress={() => setRole("ADMIN")}
                disabled={busy}
              >
                <Text style={styles.roleOptionIcon}>👑</Text>
                <Text
                  style={[
                    styles.roleOptionLabel,
                    role === "ADMIN" && styles.roleOptionLabelActive,
                  ]}
                >
                  {t.roles.ADMIN}
                </Text>
                <Text style={styles.roleOptionHint}>{t.users.roles.ADMIN}</Text>
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.formErrorBox}>
                <Text style={styles.formErrorText}>⚠️ {error}</Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={onClose}
                disabled={busy}
              >
                <Text style={styles.modalBtnCancelText}>{t.users.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary, busy && styles.modalBtnBusy]}
                onPress={handleSave}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>{t.users.save}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  lockIcon: { fontSize: 48, marginBottom: 8 },
  lockTitle: { ...typography.title, fontSize: 20 },
  lockBody: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 14,
    marginTop: 4,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerTitle: { ...typography.title, fontSize: 20 },
  headerSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnIcon: { color: colors.onPrimary, fontSize: 18, fontWeight: "700" },
  addBtnText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: "700" as const,
  },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  retryText: {
    color: colors.danger,
    fontWeight: "700" as const,
    fontSize: 13,
  },

  listContent: { padding: 16, gap: 8 },
  sectionTitle: {
    ...typography.label,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionList: { gap: 8 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarAdmin: { backgroundColor: "rgba(255, 193, 7, 0.18)" },
  avatarCashier: { backgroundColor: "rgba(74, 108, 247, 0.18)" },
  avatarIcon: { fontSize: 22 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  youBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: "700" as const,
  },
  email: { color: colors.muted, fontSize: 12, marginTop: 2 },
  meta: { color: colors.text, fontSize: 11, marginTop: 4 },

  actions: { flexDirection: "row", gap: 4 },
  actionBtn: {
    padding: 6,
    borderRadius: 6,
  },
  actionIcon: { fontSize: 18 },

  emptyText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: 24,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    ...typography.title,
    fontSize: 20,
    marginBottom: 20,
  },
  fieldLabel: {
    ...typography.label,
    marginTop: 12,
    marginBottom: 6,
    fontSize: 12,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordHint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },

  rolePicker: { gap: 8, marginTop: 4 },
  roleOption: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  roleOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.bgElevated,
  },
  roleOptionIcon: { fontSize: 22 },
  roleOptionLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  roleOptionLabelActive: { color: colors.primary },
  roleOptionHint: {
    color: colors.muted,
    fontSize: 11,
    flex: 1,
  },

  formErrorBox: {
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  formErrorText: { color: colors.danger, fontSize: 13 },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnCancelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600" as const,
  },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnBusy: { opacity: 0.7 },
  modalBtnPrimaryText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: "700" as const,
  },
});