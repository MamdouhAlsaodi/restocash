import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

const API_BASE_URL = "http://100.100.143.125:3000/api";

// Storage abstraction that works on both native (expo-file-system) and web (localStorage)
function getStorageKey(key: string): string {
  return `restocash_${key}`;
}

async function storageGet(key: string): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem(getStorageKey(key)) : null;
    }
    const fileUri = `${FileSystem.documentDirectory}${getStorageKey(key)}.txt`;
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
        localStorage.setItem(getStorageKey(key), value);
      }
      return;
    }
    const fileUri = `${FileSystem.documentDirectory}${getStorageKey(key)}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, value);
  } catch (err) {
    console.warn("[storageSet] failed:", err);
  }
}

async function storageDelete(key: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(getStorageKey(key));
      }
      return;
    }
    const fileUri = `${FileSystem.documentDirectory}${getStorageKey(key)}.txt`;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri);
    }
  } catch {
    // already cleared
  }
}

export async function getToken(): Promise<string | null> {
  return storageGet("token");
}

export async function setToken(token: string): Promise<void> {
  return storageSet("token", token);
}

export async function clearToken(): Promise<void> {
  return storageDelete("token");
}

export type ApiError = {
  statusCode: number;
  message: string;
  details?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    auth?: boolean;
  } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const error: ApiError = {
      statusCode: response.status,
      message:
        (data && (data.message as string)) ||
        (Array.isArray(data?.message) ? data.message.join(", ") : `Request failed (${response.status})`),
      details: data,
    };
    throw error;
  }

  return data as T;
}
