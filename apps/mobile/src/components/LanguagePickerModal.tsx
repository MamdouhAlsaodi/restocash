import { Modal, Pressable, View, Text, StyleSheet } from "react-native";
import { useT, useLocale, LOCALES } from "../i18n";
import { colors, typography, radii } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Modal that lets the user pick the UI language.
 * Reusable from LoginScreen and the bottom tab bar.
 */
export function LanguagePickerModal({ visible, onClose }: Props) {
  const t = useT();
  const [current, setLocale] = useLocale();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation?.()}>
          <Text style={styles.title}>{t.languagePicker.title}</Text>
          <Text style={styles.body}>{t.languagePicker.description}</Text>

          <View style={styles.list}>
            {LOCALES.map((l) => {
              const active = current === l.code;
              return (
                <Pressable
                  key={l.code}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={async () => {
                    await setLocale(l.code);
                    onClose();
                  }}
                >
                  <Text style={styles.flag}>{l.flag}</Text>
                  <Text
                    style={[styles.label, active && styles.labelActive]}
                  >
                    {l.label}
                  </Text>
                  {active && <Text style={styles.check}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>{t.languagePicker.cancel}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.bg,
    borderRadius: radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    ...typography.title,
    fontSize: 20,
    marginBottom: 6,
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  rowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.bgElevated,
  },
  flag: { fontSize: 28, marginRight: 14 },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
  },
  labelActive: { color: colors.primary },
  check: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "700" as const,
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600" as const,
  },
});