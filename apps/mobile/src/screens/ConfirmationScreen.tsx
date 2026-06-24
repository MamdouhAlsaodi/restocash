import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { Sale } from "../api/types";
import { colors, typography } from "../theme";

export function ConfirmationScreen({ route, navigation }: { route: any; navigation: any }) {
  const sale: Sale = route.params?.sale;

  const paymentLabels: Record<string, string> = {
    CASH: "Dinheiro",
    PIX: "Pix",
    CARD_DEBIT: "Débito",
    CARD_CREDIT: "Crédito",
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
        <Text style={styles.title}>Venda realizada!</Text>
        <Text style={styles.saleNumber}>{sale?.saleNumber ?? ""}</Text>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total</Text>
            <Text style={styles.detailValue}>
              R$ {Number(sale?.totalAmount ?? 0).toFixed(2).replace(".", ",")}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pagamento</Text>
            <Text style={styles.detailValue}>
              {paymentLabels[sale?.paymentMethod] ?? sale?.paymentMethod}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Itens</Text>
            <Text style={styles.detailValue}>{sale?.items?.length ?? 0}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.newSaleBtn}
          onPress={() => navigation.replace("Cashier")}
        >
          <Text style={styles.newSaleBtnText}>Nova venda</Text>
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
