import { INestApplication } from "@nestjs/common";
import { PaymentMethod, UserRole } from "@prisma/client";
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

describe("Sales checkout integration", () => {
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

  it("recalculates totals from DB and stores sale item snapshots", async () => {
    await createUser({ email: "admin@restocash.test", role: UserRole.ADMIN });
    const { product } = await createCategoryAndProduct({
      productName: "Cheese Burger",
      price: "28.90",
    });
    const token = await login(app, "admin@restocash.test");

    const response = await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 2, PaymentMethod.PIX))
      .expect(201);

    expect(response.body.saleNumber).toMatch(/^RC-/);
    expect(Number(response.body.totalAmount)).toBe(57.8);
    expect(response.body.paymentMethod).toBe(PaymentMethod.PIX);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toMatchObject({
      productId: product.id,
      productNameSnapshot: "Cheese Burger",
      quantity: 2,
    });
    expect(Number(response.body.items[0].unitPriceSnapshot)).toBe(28.9);
    expect(Number(response.body.items[0].subtotal)).toBe(57.8);

    const savedSale = await prisma.sale.findUnique({
      where: { id: response.body.id },
      include: { items: true },
    });

    expect(savedSale).not.toBeNull();
    expect(Number(savedSale?.totalAmount)).toBe(57.8);
    expect(savedSale?.items[0].productNameSnapshot).toBe("Cheese Burger");
  });

  it("rejects an empty cart", async () => {
    await createUser({ email: "admin@restocash.test", role: UserRole.ADMIN });
    const token = await login(app, "admin@restocash.test");

    await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send({ paymentMethod: PaymentMethod.PIX, items: [] })
      .expect(400);
  });

  it("rejects quantity zero", async () => {
    await createUser({ email: "admin@restocash.test", role: UserRole.ADMIN });
    const { product } = await createCategoryAndProduct();
    const token = await login(app, "admin@restocash.test");

    await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 0))
      .expect(400);
  });

  it("rejects missing product ids", async () => {
    await createUser({ email: "admin@restocash.test", role: UserRole.ADMIN });
    const token = await login(app, "admin@restocash.test");

    await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload("missing-product-id", 1))
      .expect(400);
  });

  it("rejects inactive products", async () => {
    await createUser({ email: "admin@restocash.test", role: UserRole.ADMIN });
    const { product } = await createCategoryAndProduct({ isActive: false });
    const token = await login(app, "admin@restocash.test");

    await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 1))
      .expect(400);
  });

  it("allows cashiers to checkout", async () => {
    await createUser({ email: "cashier@restocash.test", role: UserRole.CASHIER });
    const { product } = await createCategoryAndProduct({ price: "10.00" });
    const token = await login(app, "cashier@restocash.test");

    const response = await request(app.getHttpServer())
      .post("/api/sales/checkout")
      .set(authHeader(token))
      .send(checkoutPayload(product.id, 3, PaymentMethod.CASH))
      .expect(201);

    expect(Number(response.body.totalAmount)).toBe(30);
    expect(response.body.createdBy.email).toBe("cashier@restocash.test");
  });
});
