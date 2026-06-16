export const PAYMENT_METHODS = ["CASH", "PIX", "CARD_DEBIT", "CARD_CREDIT"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const USER_ROLES = ["ADMIN", "CASHIER"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SALE_STATUSES = ["COMPLETED", "CANCELLED"] as const;
export type SaleStatus = (typeof SALE_STATUSES)[number];
