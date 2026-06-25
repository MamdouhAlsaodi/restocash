import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, typography } from "../theme";
import { useT } from "../i18n";

/**
 * Placeholder screen for the upcoming Order system.
 *
 * Wired into the tab bar so admins/cashiers see the slot, but the
 * API endpoint is not yet implemented. The Prisma schema and TypeScript
 * types are already prepared — see schema.prisma and api/types.ts.
 */
export function OrdersScreen() {
  const t = useT();
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.orders.title}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>📋</Text>
        </View>
        <Text style={styles.title}>{t.orders.title}</Text>
        <Text style={styles.subtitle}>{t.orders.placeholder}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.title, fontSize: 20 },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconText: { fontSize: 36 },
  title: {
    ...typography.title,
    fontSize: 22,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    fontSize: 14,
  },
});