import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { salesApi } from "../api";
import type { PaymentMethod, Sale } from "../api/types";
import { useCart } from "../context/CartContext";
import { colors, typography } from "../theme";

const PAYMENT_OPTIONS: { label: string; value: PaymentMethod; icon: string }[] = [
  { label: "Dinheiro", value: "CASH", icon: "💵" },
  { label: "Pix", value: "PIX", icon: "📱" },
  { label: "Débito", value: "CARD_DEBIT", icon: "💳" },
  { label: "Crédito", value: "CARD_CREDIT", icon: "💳" },
];

export function PaymentScreen({ navigation }: { navigation: any }) {
  const { items, totalPrice, clearCart } = useCart();
  const [selected, setSelected] = useState<PaymentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const sale = await salesApi.checkout(
        items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        selected,
      );
      clearCart();
      navigation.replace("Confirmation", { sale });
    } catch (err: any) {
      setError(err?.message ?? "Erro ao finalizar venda");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pagamento</Text>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Total a pagar</Text>
        <Text style={styles.summaryValue}>
          R$ {totalPrice.toFixed(2).replace(".", ",")}
        </Text>
        <Text style={styles.summaryItems}>{items.length} item(s)</Text>
      </View>

      <View style={styles.optionsWrap}>
        <Text style={styles.sectionLabel}>Forma de pagamento</Text>
        <View style={styles.optionsGrid}>
          {PAYMENT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionCard,
                selected === opt.value && styles.optionCardActive,
              ]}
              onPress={() => setSelected(opt.value)}
            >
              <Text style={styles.optionIcon}>{opt.icon}</Text>
              <Text
                style={[
                  styles.optionLabel,
                  selected === opt.value && styles.optionLabelActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          disabled={busy}
        >
          <Text style={styles.cancelBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
          onPress={handleCheckout}
          disabled={!selected || busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={styles.confirmBtnText}>Confirmar ✓</Text>
          )}
        </TouchableOpacity>
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
  summary: {
    alignItems: "center",
    paddingVertical: 32,
  },
  summaryLabel: { color: colors.muted, fontSize: 16 },
  summaryValue: {
    color: colors.gold,
    fontSize: 40,
    fontWeight: "700" as const,
    marginVertical: 8,
  },
  summaryItems: { color: colors.muted, fontSize: 14 },
  optionsWrap: { paddingHorizontal: 20 },
  sectionLabel: {
    ...typography.label,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  optionCard: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.cardAlt,
  },
  optionIcon: { fontSize: 32, marginBottom: 8 },
  optionLabel: { color: colors.text, fontSize: 16, fontWeight: "600" as const },
  optionLabelActive: { color: colors.primary },
  error: {
    color: colors.danger,
    textAlign: "center",
    fontSize: 14,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  cancelBtnText: { color: colors.text, fontSize: 16 },
  confirmBtn: {
    flex: 2,
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmBtnText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: "700" as const,
  },
});
