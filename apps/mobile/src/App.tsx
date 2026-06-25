import { useState } from "react";
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet, LogBox, Modal, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { LoginScreen } from "./screens/LoginScreen";
import { CashierScreen } from "./screens/CashierScreen";
import { CartScreen } from "./screens/CartScreen";
import { PaymentScreen } from "./screens/PaymentScreen";
import { ConfirmationScreen } from "./screens/ConfirmationScreen";
import { ReportsScreen } from "./screens/ReportsScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { OrdersScreen } from "./screens/OrdersScreen";
import { UsersScreen } from "./screens/UsersScreen";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { colors } from "./theme";
import { useT } from "./i18n";

LogBox.ignoreLogs(["Sending"]);

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Cart: undefined;
  Payment: undefined;
  Confirmation: { sale: unknown };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/* ── Main screen with bottom tabs ── */
type TabKey = "dashboard" | "cashier" | "orders" | "reports" | "users";

function MainScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const t = useT();
  const [activeTab, setActiveTab] = useState<TabKey>("cashier");
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {activeTab === "dashboard" ? (
          <DashboardScreen onNavigateToUsers={() => setActiveTab("users")} />
        ) : activeTab === "cashier" ? (
          <CashierScreen navigation={navigation} />
        ) : activeTab === "orders" ? (
          <OrdersScreen />
        ) : activeTab === "users" ? (
          <UsersScreen />
        ) : (
          <ReportsScreen />
        )}
      </View>

      {/* Bottom tab bar — respects safe area (gesture bar / 3-button bar) */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {isAdmin && (
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab("dashboard")}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>📊</Text>
            <Text style={[styles.tabLabel, activeTab !== "dashboard" ? styles.tabLabelInactive : null]}>
              {t.tabs.dashboard}
            </Text>
            {activeTab === "dashboard" && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("cashier")}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>🍔</Text>
          <Text style={[styles.tabLabel, activeTab !== "cashier" ? styles.tabLabelInactive : null]}>
            {t.tabs.cashier}
          </Text>
          {activeTab === "cashier" && <View style={styles.activeUnderline} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("orders")}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={[styles.tabLabel, activeTab !== "orders" ? styles.tabLabelInactive : null]}>
            {t.tabs.orders}
          </Text>
          {activeTab === "orders" && <View style={styles.activeUnderline} />}
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab("users")}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>👥</Text>
            <Text style={[styles.tabLabel, activeTab !== "users" ? styles.tabLabelInactive : null]}>
              {t.users.title}
            </Text>
            {activeTab === "users" && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        )}

        {isAdmin && (
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab("reports")}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>📈</Text>
            <Text style={[styles.tabLabel, activeTab !== "reports" ? styles.tabLabelInactive : null]}>
              {t.tabs.reports}
            </Text>
            {activeTab === "reports" && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setLogoutModalOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>🚪</Text>
          <Text style={styles.tabLabelInactive}>{t.tabs.logout}</Text>
        </TouchableOpacity>
      </View>

      {/* Logout confirmation modal */}
      <Modal
        visible={logoutModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setLogoutModalOpen(false)}
        >
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation?.()}>
            <Text style={styles.modalTitle}>{t.logout.title}</Text>
            <Text style={styles.modalBody}>
              {t.logout.body}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setLogoutModalOpen(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnCancelText}>{t.logout.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDanger]}
                onPress={async () => {
                  setLogoutModalOpen(false);
                  await logout();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBtnDangerText}>{t.logout.confirm}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Root navigator ── */
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.bg,
          card: colors.card,
          primary: colors.primary,
          text: colors.text,
          border: colors.border,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Payment" component={PaymentScreen} />
            <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="light" />
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  tabIcon: { fontSize: 20 },
  tabLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  tabLabelInactive: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  activeUnderline: {
    marginTop: 4,
    width: 30,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  modalBody: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalBtnCancel: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalBtnCancelText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600" as const,
  },
  modalBtnDanger: {
    backgroundColor: colors.danger,
  },
  modalBtnDangerText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700" as const,
  },
});
