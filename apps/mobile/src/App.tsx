import { useState } from "react";
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet, LogBox } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NavigationContainer, DarkTheme } from "@react-navigation/native";
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
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { colors } from "./theme";

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
function MainScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [activeTab, setActiveTab] = useState<"cashier" | "reports">("cashier");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
        {activeTab === "cashier" ? (
          <CashierScreen navigation={navigation} />
        ) : (
          <ReportsScreen />
        )}
      </View>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab("cashier")}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>🍔</Text>
          <Text style={[styles.tabLabel, activeTab !== "cashier" && styles.tabLabelInactive]}>
            Caixa
          </Text>
          {activeTab === "cashier" && <View style={styles.activeUnderline} />}
        </TouchableOpacity>

        {isAdmin && (
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab("reports")}
            activeOpacity={0.7}
          >
            <Text style={styles.tabIcon}>📊</Text>
            <Text style={[styles.tabLabel, activeTab !== "reports" && styles.tabLabelInactive]}>
              Relatório
            </Text>
            {activeTab === "reports" && <View style={styles.activeUnderline} />}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.tab} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.tabIcon}>🚪</Text>
          <Text style={styles.tabLabelInactive}>Sair</Text>
        </TouchableOpacity>
      </View>
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
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.bg,
          card: colors.card,
          primary: colors.primary,
          text: colors.white,
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
});
