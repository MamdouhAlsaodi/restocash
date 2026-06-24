import { apiFetch } from "./client";
import type { Category, LoginResponse, PaymentMethod, Product, Sale, CheckoutItem, DailyReport } from "./types";

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
};

export const reportsApi = {
  daily: (date: string) => apiFetch<DailyReport>(`/reports/daily?date=${date}`),
};
