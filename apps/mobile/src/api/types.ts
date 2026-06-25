export type UserRole = "ADMIN" | "CASHIER" | "SUPER_ADMIN";
export type PaymentMethod = "CASH" | "PIX" | "CARD_DEBIT" | "CARD_CREDIT";
export type SaleStatus = "COMPLETED" | "CANCELLED";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export type Category = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  price: string;
  isActive: boolean;
};

export type CheckoutItem = {
  productId: string;
  quantity: number;
};

export type SaleItemSnapshot = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
  subtotal: string;
};

export type Sale = {
  id: string;
  saleNumber: string;
  totalAmount: string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  createdByUserId: string;
  createdAt: string;
  items: SaleItemSnapshot[];
  createdBy?: { id: string; name: string; email: string; role: UserRole };
};

export type DailyReport = {
  date: string;
  total: number;
  count: number;
  byPaymentMethod: Record<PaymentMethod, number>;
  sales: {
    id: string;
    saleNumber: string;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    createdAt: string;
  }[];
};

/* ── Order system (placeholder — types prepared for upcoming work) ─ */

export type OrderType = "DINE_IN" | "TAKEAWAY" | "DELIVERY";
export type OrderStatus = "OPEN" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";

export type OrderItemSnapshot = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceSnapshot: string;
  quantity: number;
  subtotal: string;
  notes?: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  tableId?: string | null;
  customerName?: string | null;
  notes?: string | null;
  totalAmount: string;
  createdByUserId: string;
  createdAt: string;
  closedAt?: string | null;
  items: OrderItemSnapshot[];
};

/* ── Users (admin user management) ─ */

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  _count?: { salesCreated: number };
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  role?: UserRole;
  password?: string;
};
