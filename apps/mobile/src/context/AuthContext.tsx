import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Platform } from "react-native";

import { authApi } from "../api";
import { clearToken, getToken, setToken } from "../api/client";
import type { AuthUser } from "../api/types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = "auth_user";

async function storageGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem(`restocash_${key}`) : null;
    }
    const { default: FileSystem } = await import("expo-file-system");
    const fileUri = `${FileSystem.documentDirectory}restocash_${key}.txt`;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(fileUri);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(`restocash_${key}`, value);
      }
      return;
    }
    const { default: FileSystem } = await import("expo-file-system");
    const fileUri = `${FileSystem.documentDirectory}restocash_${key}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, value);
  } catch (err) {
    console.warn("[AuthContext storageSet] failed:", err);
  }
}

async function storageDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(`restocash_${key}`);
      }
      return;
    }
    const { default: FileSystem } = await import("expo-file-system");
    const fileUri = `${FileSystem.documentDirectory}restocash_${key}.txt`;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri);
    }
  } catch {
    // already deleted
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const savedUser = await storageGet(USER_STORAGE_KEY);
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password);
    await setToken(res.accessToken);
    await storageSet(USER_STORAGE_KEY, JSON.stringify(res.user));
    setUser(res.user);
  }

  async function logout() {
    await clearToken();
    await storageDelete(USER_STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
