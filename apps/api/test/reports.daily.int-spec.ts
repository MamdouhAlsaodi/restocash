import { INestApplication } from "@nestjs/common";
import { PaymentMethod, SaleStatus, UserRole } from "@prisma/client";
const request = require("supertest");
import { createTestApp } from "./helpers/test-app";
import {
  authHeader,
  createSale,
  createUser,
  disconnectDatabase,
  login,
  reportDate,
  resetDatabase,
} from "./helpers/test-data";

describe("Daily reports integration", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    await disconnectDatabase();
  });

  it("aggregates completed sale totals by payment method for the requested date", async () => {
    const admin = await createUser({ email: "admin@restocash.test", role: UserRole.ADMIN });
    const date = new Date("2026-06-23T12:00:00.000Z");
    const previousDay = new Date("2026-06-22T23:59:59.000Z");

    await createSale({
      createdByUserId: admin.id,
      saleNumber: "RC-REPORT-001",
      totalAmount: "10.50",
      paymentMethod: PaymentMethod.CASH,
      createdAt: date,
    });
    await createSale({
      createdByUserId: admin.id,
      saleNumber: "RC-REPORT-002",
      totalAmount: "20.00",
      paymentMethod: PaymentMethod.PIX,
      createdAt: new Date("2026-06-23T18:30:00.000Z"),
    });
    await createSale({
      createdByUserId: admin.id,
      saleNumber: "RC-REPORT-003",
      totalAmount: "5.25",
      paymentMethod: PaymentMethod.CASH,
      createdAt: new Date("2026-06-23T23:59:59.000Z"),
    });
    await createSale({
      createdByUserId: admin.id,
      saleNumber: "RC-OTHER-DAY",
      totalAmount: "99.00",
      paymentMethod: PaymentMethod.CASH,
      createdAt: previousDay,
    });

    const token = await login(app, "admin@restocash.test");

    const response = await request(app.getHttpServer())
      .get(`/api/reports/daily?date=${reportDate(date)}`)
      .set(authHeader(token))
      .expect(200);

    expect(response.body).toMatchObject({
      date: "2026-06-23",
      count: 3,
      total: 35.75,
      byPaymentMethod: {
        CASH: 15.75,
        PIX: 20,
        CARD_DEBIT: 0,
        CARD_CREDIT: 0,
      },
    });
    expect(response.body.sales.map((sale: { saleNumber: string }) => sale.saleNumber)).toEqual([
      "RC-REPORT-001",
      "RC-REPORT-002",
      "RC-REPORT-003",
    ]);
  });

  it("excludes cancelled sales from daily totals", async () => {
    const admin = await createUser({ email: "admin@restocash.test", role: UserRole.ADMIN });
    const date = new Date("2026-06-23T10:00:00.000Z");

    await createSale({
      createdByUserId: admin.id,
      saleNumber: "RC-COMPLETED",
      totalAmount: "40.00",
      paymentMethod: PaymentMethod.CARD_DEBIT,
      createdAt: date,
    });
    await createSale({
      createdByUserId: admin.id,
      saleNumber: "RC-CANCELLED",
      totalAmount: "100.00",
      paymentMethod: PaymentMethod.CARD_DEBIT,
      status: SaleStatus.CANCELLED,
      createdAt: date,
    });

    const token = await login(app, "admin@restocash.test");

    const response = await request(app.getHttpServer())
      .get(`/api/reports/daily?date=${reportDate(date)}`)
      .set(authHeader(token))
      .expect(200);

    expect(response.body.count).toBe(1);
    expect(response.body.total).toBe(40);
    expect(response.body.byPaymentMethod.CARD_DEBIT).toBe(40);
    expect(response.body.sales.map((sale: { saleNumber: string }) => sale.saleNumber)).toEqual([
      "RC-COMPLETED",
    ]);
  });

  it("blocks cashiers from admin-only daily reports", async () => {
    await createUser({ email: "cashier@restocash.test", role: UserRole.CASHIER });
    const token = await login(app, "cashier@restocash.test");

    await request(app.getHttpServer())
      .get("/api/reports/daily?date=2026-06-23")
      .set(authHeader(token))
      .expect(403);
  });

  it("rejects invalid report dates", async () => {
    await createUser({ email: "admin@restocash.test", role: UserRole.ADMIN });
    const token = await login(app, "admin@restocash.test");

    await request(app.getHttpServer())
      .get("/api/reports/daily?date=23-06-2026")
      .set(authHeader(token))
      .expect(400);

    await request(app.getHttpServer())
      .get("/api/reports/daily?date=2026-99-99")
      .set(authHeader(token))
      .expect(400);
  });
});
