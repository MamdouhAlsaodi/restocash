import { INestApplication } from "@nestjs/common";
import { SaleStatus, UserRole } from "@prisma/client";
const request = require("supertest");
import { createTestApp } from "./helpers/test-app";
import {
  authHeader,
  checkoutPayload,
  createCategoryAndProduct,
  createUser,
  disconnectDatabase,
  login,
  prisma,
  resetDatabase,
} from "./helpers/test-data";

describe("Sales cancellation integration", () => {
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

  it("cancels a completed sale with reason and persists audit fields", async () => {
    const admin = await createUser({
      email: "admin@restocash.test",
      role: UserRole.ADMIN,
    });
    const { product } = await createCategoryAndProduct({
      productName: "Cheese Burger",
      price: "28.90",
    });
    const token = await login(app, "admin@restocash.test");

    // Create a sale
    const checkout = await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 1, "PIX"))
      .expect(201);
    const saleId = checkout.body.id;

    // Cancel the sale
    const cancel = await request(app.getHttpServer())
      .post(`/api/sales/${saleId}/cancel`)
      .set(authHeader(token))
      .send({ reason: "Customer changed mind" })
      .expect(201);

    expect(cancel.body.id).toBe(saleId);
    expect(cancel.body.status).toBe(SaleStatus.CANCELLED);
    expect(cancel.body.cancelReason).toBe("Customer changed mind");
    expect(cancel.body.cancelledAt).toBeTruthy();

    // Verify in DB
    const dbSale = await prisma.sale.findUnique({ where: { id: saleId } });
    expect(dbSale?.status).toBe(SaleStatus.CANCELLED);
    expect(dbSale?.cancelReason).toBe("Customer changed mind");
  });

  it("cancelling an already-cancelled sale is idempotent", async () => {
    const admin = await createUser({
      email: "admin@restocash.test",
      role: UserRole.ADMIN,
    });
    const { product } = await createCategoryAndProduct();
    const token = await login(app, "admin@restocash.test");

    const checkout = await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 2))
      .expect(201);
    const saleId = checkout.body.id;

    // First cancel
    await request(app.getHttpServer())
      .post(`/api/sales/${saleId}/cancel`)
      .set(authHeader(token))
      .send({ reason: "First reason" })
      .expect(201);

    // Second cancel — should be idempotent and return 201
    const second = await request(app.getHttpServer())
      .post(`/api/sales/${saleId}/cancel`)
      .set(authHeader(token))
      .send({ reason: "Different reason" })
      .expect(201);

    // Reason should NOT have been overwritten
    expect(second.body.cancelReason).toBe("First reason");
  });

  it("blocks CASHIER from cancelling (admin only)", async () => {
    const admin = await createUser({
      email: "admin@restocash.test",
      role: UserRole.ADMIN,
    });
    await createUser({
      email: "cashier@restocash.test",
      role: UserRole.CASHIER,
    });
    const { product } = await createCategoryAndProduct();
    const adminToken = await login(app, "admin@restocash.test");
    const cashierToken = await login(app, "cashier@restocash.test");

    const checkout = await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(adminToken))
      .send(checkoutPayload(product.id, 1))
      .expect(201);
    const saleId = checkout.body.id;

    // Cashier should be forbidden
    await request(app.getHttpServer())
      .post(`/api/sales/${saleId}/cancel`)
      .set(authHeader(cashierToken))
      .send({ reason: "Cashier trying" })
      .expect(403);
  });

  it("rejects cancellation without reason", async () => {
    const admin = await createUser({
      email: "admin@restocash.test",
      role: UserRole.ADMIN,
    });
    const { product } = await createCategoryAndProduct();
    const token = await login(app, "admin@restocash.test");

    const checkout = await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 1))
      .expect(201);
    const saleId = checkout.body.id;

    // Empty reason
    await request(app.getHttpServer())
      .post(`/api/sales/${saleId}/cancel`)
      .set(authHeader(token))
      .send({ reason: "" })
      .expect(400);

    // Missing reason
    await request(app.getHttpServer())
      .post(`/api/sales/${saleId}/cancel`)
      .set(authHeader(token))
      .send({})
      .expect(400);
  });

  it("returns 404 for non-existent sale", async () => {
    const admin = await createUser({
      email: "admin@restocash.test",
      role: UserRole.ADMIN,
    });
    const token = await login(app, "admin@restocash.test");

    await request(app.getHttpServer())
      .post("/api/sales/non-existent-id/cancel")
      .set(authHeader(token))
      .send({ reason: "Test" })
      .expect(404);
  });

  it("rejects unauthenticated cancellation", async () => {
    await request(app.getHttpServer())
      .post("/api/sales/some-id/cancel")
      .send({ reason: "No auth" })
      .expect(401);
  });

  it("excludes cancelled sales from daily report", async () => {
    const admin = await createUser({
      email: "admin@restocash.test",
      role: UserRole.ADMIN,
    });
    const { product } = await createCategoryAndProduct({
      productName: "Pizza",
      price: "50.00",
    });
    const token = await login(app, "admin@restocash.test");

    // Make 2 sales
    const sale1 = await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 1, "PIX"))
      .expect(201);
    const sale2 = await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 1, "PIX"))
      .expect(201);

    // Cancel sale1
    await request(app.getHttpServer())
      .post(`/api/sales/${sale1.body.id}/cancel`)
      .set(authHeader(token))
      .send({ reason: "Returned" })
      .expect(201);

    // Daily report should only count sale2
    const today = new Date().toISOString().slice(0, 10);
    const report = await request(app.getHttpServer())
      .get(`/api/reports/daily?date=${today}`)
      .set(authHeader(token))
      .expect(200);

    expect(report.body.count).toBe(1);
    expect(Number(report.body.total)).toBe(50);
  });
});
