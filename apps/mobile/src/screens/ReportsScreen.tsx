import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { reportsApi, salesApi } from "../api";
import type { DailyReport, Sale, PaymentMethod } from "../api/types";
import { colors, typography } from "../theme";
import { useT, fmtMoney, fmtTime } from "../i18n";

const paymentOrder: PaymentMethod[] = [
  "CASH",
  "PIX",
  "CARD_DEBIT",
  "CARD_CREDIT",
];

export function ReportsScreen() {
  const today = new Date().toISOString().slice(0, 10);
  const t = useT();
  const [date, setDate] = useState(today);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [loadingSale, setLoadingSale] = useState(false);

  const loadReport = useCallback(async () => {
    if (!date) {
      setError(t.reports.selectDateFirst);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await reportsApi.daily(date);
      setReport(data);
    } catch (err: any) {
      setError(err?.message ?? t.common.error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const openSale = async (saleId: string) => {
    setLoadingSale(true);
    try {
      const sale = await salesApi.byId(saleId);
      setSelectedSale(sale);
    } catch (err: any) {
      setError(err?.message ?? t.reports.loadFailed);
    } finally {
      setLoadingSale(false);
    }
  };

  const breakdown = report
    ? paymentOrder.map((method) => ({
        method,
        amount: report.byPaymentMethod[method] ?? 0,
        count: report.sales.filter((s) => s.paymentMethod === method).length,
      }))
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.reports.title}</Text>
      </View>

      <View style={styles.dateRow}>
        <TextInput
          style={styles.dateInput}
          placeholder={t.reports.datePlaceholder}
          placeholderTextColor={colors.muted}
          value={date}
          onChangeText={setDate}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={loadReport} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.searchBtnText}>{t.reports.search}</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        {!report && !loading && (
          <Text style={styles.emptyText}>{t.reports.initialHint}</Text>
        )}

        {report && (
          <>
            {/* Top summary card — total */}
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>{t.reports.totalLabel}</Text>
              <Text style={styles.totalValue}>{fmtMoney(report.total)}</Text>
              <Text style={styles.totalCount}>{t.reports.salesCount(report.count)}</Text>
            </View>

            {/* Breakdown by payment method */}
            <Text style={styles.sectionTitle}>{t.reports.byMethod}</Text>
            <View style={styles.methodList}>
              {breakdown.map(({ method, amount, count }) => (
                <View key={method} style={styles.methodRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodLabel}>{t.payment[method]}</Text>
                    <Text style={styles.methodCount}>
                      {count} {count === 1 ? t.common.sale : t.common.sales}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.methodAmount,
                      amount === 0 && styles.methodAmountZero,
                    ]}
                  >
                    {fmtMoney(amount)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Sales list */}
            <Text style={styles.sectionTitle}>
              {t.reports.salesTitle(report.sales.length)}
            </Text>
            <View style={styles.salesList}>
              {report.sales.length === 0 && (
                <Text style={styles.emptyText}>{t.reports.noSales}</Text>
              )}
              {report.sales.map((sale) => (
                <TouchableOpacity
                  key={sale.id}
                  style={styles.saleRow}
                  onPress={() => openSale(sale.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.saleLeft}>
                    <Text style={styles.saleNumber}>{sale.saleNumber}</Text>
                    <Text style={styles.saleMeta}>
                      {fmtTime(sale.createdAt)} •{" "}
                      {t.payment[sale.paymentMethod as keyof typeof t.payment] ??
                        sale.paymentMethod}
                    </Text>
                  </View>
                  <View style={styles.saleRight}>
                    <Text style={styles.saleAmount}>
                      {fmtMoney(sale.totalAmount)}
                    </Text>
                    <Text style={styles.saleChevron}>›</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ height: 32 }} />
          </>
        )}
      </ScrollView>

      {/* Sale details modal */}
      <Modal
        visible={selectedSale !== null || loadingSale}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedSale(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {loadingSale || !selectedSale ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalLoadingText}>{t.common.loading}</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator>
                <Text style={styles.modalTitle}>{selectedSale.saleNumber}</Text>
                <Text style={styles.modalSubtitle}>
                  {fmtTime(selectedSale.createdAt)} •{" "}
                  {t.payment[selectedSale.paymentMethod as keyof typeof t.payment] ??
                    selectedSale.paymentMethod}
                </Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalSection}>{t.reports.itemsSection}</Text>
                {selectedSale.items?.length ? (
                  selectedSale.items.map((item) => (
                    <View key={item.id} style={styles.modalItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modalItemName}>
                          {item.quantity}× {item.productNameSnapshot}
                        </Text>
                        <Text style={styles.modalItemUnit}>
                          {fmtMoney(item.unitPriceSnapshot)} {t.reports.each}
                        </Text>
                      </View>
                      <Text style={styles.modalItemSubtotal}>
                        {fmtMoney(item.subtotal)}
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>{t.reports.noItems}</Text>
                )}

                <View style={styles.modalDivider} />

                <View style={styles.modalTotalRow}>
                  <Text style={styles.modalTotalLabel}>{t.reports.total}</Text>
                  <Text style={styles.modalTotalValue}>
                    {fmtMoney(selectedSale.totalAmount)}
                  </Text>
                </View>

                {selectedSale.createdBy?.name && (
                  <Text style={styles.modalCashier}>
                    {t.reports.cashier}: {selectedSale.createdBy.name}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedSale(null)}
                >
                  <Text style={styles.modalCloseBtnText}>{t.reports.close}</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
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
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },
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
    alignItems: "center",
  },
  methodLabel: { color: colors.text, fontSize: 16, fontWeight: "600" as const },
  methodCount: { color: colors.muted, fontSize: 12, marginTop: 2 },
  methodAmount: { color: colors.text, fontSize: 16, fontWeight: "700" as const },
  methodAmountZero: { color: colors.muted },
  salesList: { gap: 8 },
  saleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  saleLeft: { gap: 4, flex: 1 },
  saleNumber: { color: colors.text, fontSize: 13, fontWeight: "600" as const },
  saleMeta: { color: colors.muted, fontSize: 12 },
  saleRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  saleAmount: { color: colors.primary, fontSize: 16, fontWeight: "700" as const },
  saleChevron: { color: colors.muted, fontSize: 24 },
  emptyText: { color: colors.muted, textAlign: "center", paddingVertical: 20 },

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
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalLoading: {
    paddingVertical: 60,
    alignItems: "center",
    gap: 12,
  },
  modalLoadingText: { color: colors.muted, fontSize: 14 },
  modalTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.text,
  },
  modalSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  modalSection: {
    ...typography.label,
    marginBottom: 8,
  },
  modalItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    alignItems: "center",
  },
  modalItemName: { color: colors.text, fontSize: 14 },
  modalItemUnit: { color: colors.muted, fontSize: 12, marginTop: 2 },
  modalItemSubtotal: { color: colors.text, fontSize: 14, fontWeight: "600" as const },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTotalLabel: { color: colors.muted, fontSize: 14 },
  modalTotalValue: { color: colors.gold, fontSize: 22, fontWeight: "700" as const },
  modalCashier: { color: colors.muted, fontSize: 12, textAlign: "right" },
  modalCloseBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 16,
  },
  modalCloseBtnText: { color: colors.onPrimary, fontWeight: "700" as const },
});