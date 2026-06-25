import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Sale } from "../api/types";
import { useCart } from "../context/CartContext";
import { colors, typography } from "../theme";
import { useT, fmtMoney } from "../i18n";

export function ConfirmationScreen({ route, navigation }: { route: any; navigation: any }) {
  const sale: Sale = route.params?.sale;
  const { clearCart } = useCart();
  const t = useT();

  const paymentLabels: Record<string, string> = {
    CASH: t.payment.CASH,
    PIX: t.payment.PIX,
    CARD_DEBIT: t.payment.CARD_DEBIT,
    CARD_CREDIT: t.payment.CARD_CREDIT,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.title}>{t.confirmation.success}</Text>
        <Text style={styles.saleNumber}>{sale?.saleNumber ?? ""}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.common.total}</Text>
            <Text style={styles.detailValue}>
              {fmtMoney(sale?.totalAmount ?? 0)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.confirmation.paymentLabel}</Text>
            <Text style={styles.detailValue}>
              {paymentLabels[sale?.paymentMethod] ?? sale?.paymentMethod}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t.confirmation.itemsLabel}</Text>
            <Text style={styles.detailValue}>{sale?.items?.length ?? 0}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newSaleBtn}
          onPress={() => {
            clearCart();
            navigation.popToTop();
            navigation.navigate("Main");
          }}
        >
          <Text style={styles.newSaleBtnText}>{t.confirmation.newSale}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.green,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  checkIcon: { fontSize: 40, color: colors.onPrimary, fontWeight: "700" as const },
  title: { ...typography.title, fontSize: 28, marginBottom: 4 },
  saleNumber: { color: colors.muted, fontSize: 14, marginBottom: 32 },
  detailsCard: {
    width: "100%",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: { color: colors.muted, fontSize: 16 },
  detailValue: { color: colors.text, fontSize: 16, fontWeight: "600" as const },
  newSaleBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  newSaleBtnText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: "700" as const,
  },
});
