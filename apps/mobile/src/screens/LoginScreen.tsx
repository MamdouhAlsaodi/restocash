import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { colors, typography } from "../theme";
import { useT, useLocale } from "../i18n";
import { LanguagePickerModal } from "../components/LanguagePickerModal";

export function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useT();
  const [currentLocale, setLocale] = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    setError(null);
  }, [email, password]);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError(t.login.fillBoth);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.login.failed;
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  const langFlag = currentLocale === "ar" ? "🇸🇦" : "🇧🇷";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Top-right language switcher — prominent so replacements can find it */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() => setLangOpen(true)}
          activeOpacity={0.7}
          accessibilityLabel="Change language"
        >
          <Text style={styles.langFlag}>{langFlag}</Text>
          <Text style={styles.langCode}>
            {currentLocale === "ar" ? "AR" : "PT"}
          </Text>
          <Text style={styles.langChevron}>⌄</Text>
        </TouchableOpacity>
      </View>

      <LanguagePickerModal
        visible={langOpen}
        onClose={() => setLangOpen(false)}
      />

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
            <Text style={styles.title}>{t.login.title}</Text>
            <Text style={styles.subtitle}>{t.login.subtitle}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>{t.login.email}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.login.emailPlaceholder}
              placeholderTextColor={colors.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />

            <Text style={styles.label}>{t.login.password}</Text>
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
                  <Text style={styles.buttonText}>{t.login.submitting}</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>{t.login.submit}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.hint}>{t.login.hint}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  langFlag: { fontSize: 18 },
  langCode: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  langChevron: {
    color: colors.muted,
    fontSize: 14,
    marginTop: -2,
  },
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
    boxShadow: "0 4px 12px rgba(67, 160, 71, 0.30)",
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
    boxShadow: "0 4px 8px rgba(67, 160, 71, 0.30)",
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
