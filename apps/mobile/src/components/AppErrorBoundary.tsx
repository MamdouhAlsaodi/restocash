import { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";

import { colors } from "../theme";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): State {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[RestoCash] App crashed:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>⚠️ خطأ في التطبيق</Text>
          <Text style={styles.subtitle}>{this.state.error.message}</Text>
          <ScrollView style={styles.scroll}>
            <Text style={styles.code}>
              {this.state.error.stack ?? "no stack trace"}
            </Text>
            {this.state.errorInfo && (
              <Text style={styles.code}>
                {this.state.errorInfo.componentStack}
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
    paddingTop: 60,
  },
  title: { color: colors.danger, fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { color: colors.white, fontSize: 16, marginBottom: 16 },
  scroll: { flex: 1 },
  code: { color: colors.muted, fontSize: 12, fontFamily: "monospace" },
});
