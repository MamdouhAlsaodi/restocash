import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { colors, typography } from "../theme";

export function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError(null);
  }, [email, password]);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError("Preencha email e senha");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login falhou";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.content, { paddingBottom: insets.bottom }]}>
          {/* Logo / brand */}
          <View style={styles.brand}>
            <View style={styles.logoCircle}>
              <Text style={[styles.logoText, { color: colors.onPrimary }]}>R$</Text>
            </View>
            <Text style={styles.title}>RestoCash</Text>
            <Text style={styles.subtitle}>Sistema de Caixa</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="admin@restocash.local"
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
              autoComplete="password"
              onSubmitEditing={handleLogin}
            />

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, busy && styles.buttonBusy]}
              onPress={handleLogin}
              disabled={busy}
              activeOpacity={0.8}
            >
              {busy ? (
                <View style={styles.busyContent}>
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                  <Text style={styles.buttonText}>Entrando…</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>
              ADMIN: admin@restocash.local / admin123
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingTop: 40,
  },
  brand: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    color: colors.onPrimary,
    fontSize: 24,
    fontWeight: "800" as const,
  },
  title: {
    ...typography.title,
    fontSize: 32,
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    color: colors.muted,
    fontSize: 15,
  },
  form: { gap: 6 },
  label: {
    ...typography.label,
    marginTop: 14,
    marginBottom: 6,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBox: {
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonBusy: {
    opacity: 0.7,
  },
  busyContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 17,
    fontWeight: "700" as const,
  },
  hint: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 16,
  },
});
