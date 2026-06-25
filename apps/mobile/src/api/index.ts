import { apiFetch } from "./client";
import type {
  Category,
  CreateUserPayload,
  DailyReport,
  LoginResponse,
  PaymentMethod,
  Product,
  Sale,
  CheckoutItem,
  UpdateUserPayload,
  UserSummary,
} from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    }),

  me: () => apiFetch<{ user: { id: string; name: string; email: string; role: string } }>("/auth/me"),
};

export const catalogApi = {
  categories: () => apiFetch<Category[]>("/categories"),
  products: (categoryId?: string) =>
    apiFetch<Product[]>(`/products${categoryId ? `?categoryId=${categoryId}` : ""}`),
};

export const salesApi = {
  checkout: (items: CheckoutItem[], paymentMethod: PaymentMethod) =>
    apiFetch<Sale>("/sales/checkout", {
      method: "POST",
      body: { items, paymentMethod },
    }),
  byId: (id: string) => apiFetch<Sale>(`/sales/${id}`),
};

export const reportsApi = {
  daily: (date: string) => apiFetch<DailyReport>(`/reports/daily?date=${date}`),
};

export const usersApi = {
  list: () => apiFetch<UserSummary[]>("/users"),
  create: (payload: CreateUserPayload) =>
    apiFetch<UserSummary>("/users", { method: "POST", body: payload }),
  update: (id: string, payload: UpdateUserPayload) =>
    apiFetch<UserSummary>(`/users/${id}`, { method: "PATCH", body: payload }),
  remove: (id: string) =>
    apiFetch<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" }),
};
