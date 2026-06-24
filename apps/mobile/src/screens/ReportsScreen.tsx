import { useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { reportsApi } from "../api";
import type { DailyReport } from "../api/types";
import { colors, typography } from "../theme";

const paymentLabels: Record<string, string> = {
  CASH: "Dinheiro",
  PIX: "Pix",
  CARD_DEBIT: "Débito",
  CARD_CREDIT: "Crédito",
};

export function ReportsScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.daily(date);
      setReport(data);
    } catch (err: any) {
      setError(err?.message ?? "Erro ao carregar relatório");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Relatório Diário</Text>
      </View>

      <View style={styles.dateRow}>
        <TextInput
          style={styles.dateInput}
          placeholder="AAAA-MM-DD"
          placeholderTextColor={colors.muted}
          value={date}
          onChangeText={setDate}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={loadReport} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.searchBtnText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {report && (
        <View style={styles.reportWrap}>
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total do dia</Text>
            <Text style={styles.totalValue}>
              R$ {report.total.toFixed(2).replace(".", ",")}
            </Text>
            <Text style={styles.totalCount}>{report.count} venda(s)</Text>
          </View>

          <Text style={styles.sectionTitle}>Por forma de pagamento</Text>
          <View style={styles.methodList}>
            {Object.entries(report.byPaymentMethod).map(([method, amount]) => (
              <View key={method} style={styles.methodRow}>
                <Text style={styles.methodLabel}>
                  {paymentLabels[method] ?? method}
                </Text>
                <Text style={[styles.methodAmount, amount === 0 && styles.methodAmountZero]}>
                  R$ {Number(amount).toFixed(2).replace(".", ",")}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Vendas ({report.sales.length})</Text>
          <View style={styles.salesList}>
            {report.sales.map((sale) => (
              <View key={sale.id} style={styles.saleRow}>
                <View style={styles.saleLeft}>
                  <Text style={styles.saleNumber}>{sale.saleNumber}</Text>
                  <Text style={styles.saleMethod}>{paymentLabels[sale.paymentMethod] ?? sale.paymentMethod}</Text>
                </View>
                <Text style={styles.saleAmount}>
                  R$ {Number(sale.totalAmount).toFixed(2).replace(".", ",")}
                </Text>
              </View>
            ))}
            {report.sales.length === 0 && (
              <Text style={styles.emptyText}>Nenhuma venda neste dia</Text>
            )}
          </View>
        </View>
      )}
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
  dateRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 16,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  searchBtnText: { color: colors.onPrimary, fontWeight: "700" as const },
  error: { color: colors.danger, paddingHorizontal: 20, fontSize: 14 },
  reportWrap: { flex: 1, paddingHorizontal: 20 },
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  totalLabel: { color: colors.muted, fontSize: 16 },
  totalValue: {
    color: colors.gold,
    fontSize: 36,
    fontWeight: "700" as const,
    marginVertical: 4,
  },
  totalCount: { color: colors.muted, fontSize: 14 },
  sectionTitle: {
    ...typography.label,
    marginBottom: 8,
    marginTop: 8,
  },
  methodList: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  methodLabel: { color: colors.text, fontSize: 16 },
  methodAmount: { color: colors.text, fontSize: 16, fontWeight: "700" as const },
  methodAmountZero: { color: colors.muted },
  salesList: { gap: 8, paddingBottom: 40 },
  saleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 14,
  },
  saleLeft: { gap: 2 },
  saleNumber: { color: colors.text, fontSize: 14, fontWeight: "600" as const },
  saleMethod: { color: colors.muted, fontSize: 12 },
  saleAmount: { color: colors.primary, fontSize: 16, fontWeight: "700" as const },
  emptyText: { color: colors.muted, textAlign: "center", paddingVertical: 20 },
});
