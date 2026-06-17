import { INestApplication } from "@nestjs/common";
import { PaymentMethod, PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
const request = require("supertest");

export const prisma = new PrismaClient();

export async function resetDatabase() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

export async function createUser(input: {
  email: string;
  name?: string;
  password?: string;
  role: UserRole;
}) {
  const password = input.password ?? "password123";
  return prisma.user.create({
    data: {
      email: input.email,
      name: input.name ?? input.email,
      passwordHash: await bcrypt.hash(password, 4),
      role: input.role,
    },
  });
}

export async function createCategoryAndProduct(input?: {
  categoryName?: string;
  productName?: string;
  price?: string;
  isActive?: boolean;
}) {
  const category = await prisma.category.create({
    data: {
      name: input?.categoryName ?? "Burgers",
      sortOrder: 10,
      isActive: true,
    },
  });

  const product = await prisma.product.create({
    data: {
      name: input?.productName ?? "Cheese Burger",
      categoryId: category.id,
      price: input?.price ?? "28.90",
      isActive: input?.isActive ?? true,
    },
  });

  return { category, product };
}

export async function login(app: INestApplication, email: string, password = "password123") {
  const response = await request(app.getHttpServer())
    .post("/api/auth/login")
    .send({ email, password })
    .expect(201);

  return response.body.accessToken as string;
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export function checkoutPayload(productId: string, quantity = 2, paymentMethod: PaymentMethod = PaymentMethod.PIX) {
  return {
    paymentMethod,
    items: [{ productId, quantity }],
  };
}
