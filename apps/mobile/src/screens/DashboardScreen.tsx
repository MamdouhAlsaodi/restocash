import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { colors, typography, radii } from "../theme";
import { authApi, reportsApi } from "../api";
import { useT, fmtMoney, fmtTime } from "../i18n";

type DashboardStats = {
  todaySales: number;
  todayCount: number;
  topProducts: Array<{ name: string; quantity: number; total: number }>;
  paymentBreakdown: Array<{ method: string; total: number; count: number }>;
  recentSales: Array<{ id: string; saleNumber: string; total: number; paymentMethod: string; createdAt: string }>;
};

export function DashboardScreen({ onNavigateToUsers }: { onNavigateToUsers?: () => void }) {
  const t = useT();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  async function load() {
    try {
      setError(null);
      // Use local date (not UTC) to match the server's timezone
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const [me, daily] = await Promise.all([
        authApi.me(),
        reportsApi.daily(todayStr),
      ]);
      setCurrentUser(me);

      // Aggregate the daily report into dashboard stats
      const sales = (daily as any).sales || [];
      const paymentBreakdown: Record<string, { total: number; count: number }> = {};
      let topProductsMap: Record<string, { quantity: number; total: number }> = {};

      for (const sale of sales) {
        const method = sale.paymentMethod;
        const saleTotal = Number(sale.totalAmount ?? sale.total ?? 0);
        if (!paymentBreakdown[method]) {
          paymentBreakdown[method] = { total: 0, count: 0 };
        }
        paymentBreakdown[method].total += saleTotal;
        paymentBreakdown[method].count += 1;

        for (const item of sale.items || []) {
          const name = item.productNameSnapshot;
          if (!topProductsMap[name]) {
            topProductsMap[name] = { quantity: 0, total: 0 };
          }
          topProductsMap[name].quantity += item.quantity;
          topProductsMap[name].total += Number(item.subtotal);
        }
      }

      const topProducts = Object.entries(topProductsMap)
        .map(([name, v]) => ({ name, ...v }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const paymentBreakdownArr = Object.entries(paymentBreakdown)
        .map(([method, v]) => ({ method, ...v }))
        .sort((a, b) => b.total - a.total);

      setStats({
        todaySales: Number(daily.total) || 0,
        todayCount: daily.count || 0,
        topProducts,
        paymentBreakdown: paymentBreakdownArr,
        recentSales: sales.slice(0, 5).map((s: any) => ({
          id: s.id,
          saleNumber: s.saleNumber,
          total: Number(s.totalAmount ?? s.total ?? 0),
          paymentMethod: s.paymentMethod,
          createdAt: s.createdAt,
        })),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.dashboard.loadFailed;
      setError(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t.common.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header / Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingLabel}>{t.dashboard.greeting}</Text>
        <Text style={styles.greetingName}>{currentUser?.name || t.dashboard.defaultUser}</Text>
        <Text style={styles.greetingRole}>
          {currentUser?.role === "ADMIN" ? t.roles.ADMIN : t.roles.CASHIER}
        </Text>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Today's KPIs */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.kpiLabel}>{t.dashboard.todaySales}</Text>
          <Text style={styles.kpiValue}>
            {fmtMoney(stats?.todaySales || 0)}
          </Text>
          <Text style={styles.kpiHint}>
            {stats?.todayCount || 0} {t.dashboard.orders}
          </Text>
        </View>
      </View>

      {/* Quick action: Manage users (admin only) */}
      {currentUser?.role === "ADMIN" && onNavigateToUsers && (
        <TouchableOpacity
          style={styles.usersCard}
          onPress={onNavigateToUsers}
          activeOpacity={0.8}
        >
          <View style={styles.usersCardLeft}>
            <Text style={styles.usersCardIcon}>👥</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.usersCardTitle}>{t.users.title}</Text>
              <Text style={styles.usersCardSubtitle}>{t.users.subtitle}</Text>
            </View>
          </View>
          <Text style={styles.usersCardChevron}>›</Text>
        </TouchableOpacity>
      )}

      {/* Payment methods breakdown */}
      {stats && stats.paymentBreakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dashboard.byMethod}</Text>
          {stats.paymentBreakdown.map((p) => (
            <View key={p.method} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.methodLabel}>{paymentLabel(p.method, t)}</Text>
                <Text style={styles.methodCount}>{p.count} {t.common.sales}</Text>
              </View>
              <Text style={styles.rowRight}>
                {fmtMoney(p.total)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Top products */}
      {stats && stats.topProducts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dashboard.topProducts}</Text>
          {stats.topProducts.map((p, i) => (
            <View key={p.name} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rank}>#{i + 1}</Text>
                <View>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productQty}>{p.quantity} {p.quantity === 1 ? t.dashboard.units : t.dashboard.units_plural}</Text>
                </View>
              </View>
              <Text style={styles.rowRight}>{fmtMoney(p.total)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent sales */}
      {stats && stats.recentSales.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.dashboard.recentSales}</Text>
          {stats.recentSales.map((s) => (
            <View key={s.id} style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.saleNumber}>{s.saleNumber}</Text>
                <Text style={styles.saleMeta}>
                  {paymentLabel(s.paymentMethod, t)} · {fmtTime(s.createdAt)}
                </Text>
              </View>
              <Text style={styles.rowRight}>{fmtMoney(s.total)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {stats && stats.todayCount === 0 && (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            {t.dashboard.emptyToday}
          </Text>
        </View>
      )}

      <View style={{ height: 16 }} />
    </ScrollView>
  );
}

function paymentLabel(method: string, t: ReturnType<typeof useT>): string {
  const labels: Record<string, string> = {
    CASH: t.payment.CASH,
    PIX: t.payment.PIX,
    CARD_DEBIT: t.payment.CARD_DEBIT,
    CARD_CREDIT: t.payment.CARD_CREDIT,
  };
  return labels[method] || method;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  contentContainer: { padding: 16, gap: 16 },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.textMuted,
    marginTop: 12,
    fontSize: 14,
  },
  greeting: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  greetingLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  greetingName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700" as const,
    marginTop: 2,
  },
  greetingRole: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600" as const,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: radii.md,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: { color: colors.danger, fontSize: 14, flex: 1 },
  retryBtn: {
    backgroundColor: colors.danger,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
  },
  retryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" as const },
  kpiRow: { flexDirection: "row", gap: 12 },
  kpiCard: {
    flex: 1,
    borderRadius: radii.lg,
    padding: 18,
    boxShadow: "0 4px 12px rgba(67, 160, 71, 0.20)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  kpiLabel: {
    color: "#FFFFFFCC",
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  kpiValue: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800" as const,
    marginTop: 6,
  },
  kpiHint: {
    color: "#FFFFFFCC",
    fontSize: 13,
    marginTop: 4,
  },
  usersCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  usersCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  usersCardIcon: {
    fontSize: 28,
  },
  usersCardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700" as const,
  },
  usersCardSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  usersCardChevron: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "300" as const,
  },
  section: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 16,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  rowRight: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  methodLabel: { color: colors.text, fontSize: 14, fontWeight: "600" as const },
  methodCount: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  rank: {
    color: colors.highlight,
    fontSize: 18,
    fontWeight: "800" as const,
    width: 30,
  },
  productName: { color: colors.text, fontSize: 14, fontWeight: "600" as const },
  productQty: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  saleNumber: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600" as const,
  },
  saleMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  emptyBox: {
    backgroundColor: colors.bgElevated,
    borderRadius: radii.lg,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
});
