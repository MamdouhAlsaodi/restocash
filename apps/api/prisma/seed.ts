import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

const categories = [
  { name: "Burgers", sortOrder: 10 },
  { name: "Drinks", sortOrder: 20 },
  { name: "Desserts", sortOrder: 30 },
];

const products = [
  { name: "Classic Burger", categoryName: "Burgers", price: "24.90" },
  { name: "Cheese Burger", categoryName: "Burgers", price: "28.90" },
  { name: "Chicken Burger", categoryName: "Burgers", price: "26.90" },
  { name: "Water", categoryName: "Drinks", price: "5.00" },
  { name: "Soda", categoryName: "Drinks", price: "7.50" },
  { name: "Orange Juice", categoryName: "Drinks", price: "10.00" },
  { name: "Chocolate Cake", categoryName: "Desserts", price: "12.00" },
  { name: "Ice Cream", categoryName: "Desserts", price: "9.00" },
];

async function upsertUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      passwordHash,
      role: input.role,
    },
    create: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    },
  });
}

async function main() {
  await upsertUser({
    name: "RestoCash Admin",
    email: "admin@restocash.local",
    password: "admin123",
    role: UserRole.ADMIN,
  });

  await upsertUser({
    name: "RestoCash Cashier",
    email: "cashier@restocash.local",
    password: "cashier123",
    role: UserRole.CASHIER,
  });

  // Demo users for the Users admin screen
  await upsertUser({
    name: "Sara Manager",
    email: "sara@restocash.local",
    password: "sara123",
    role: UserRole.ADMIN,
  });
  await upsertUser({
    name: "João Caixa",
    email: "joao@restocash.local",
    password: "joao123",
    role: UserRole.CASHIER,
  });
  await upsertUser({
    name: "Mariana Caixa",
    email: "mariana@restocash.local",
    password: "mariana123",
    role: UserRole.CASHIER,
  });

  const categoryByName = new Map<string, { id: string }>();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: {
        sortOrder: category.sortOrder,
        isActive: true,
      },
      create: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      select: { id: true, name: true },
    });
    categoryByName.set(saved.name, { id: saved.id });
  }

  for (const product of products) {
    const category = categoryByName.get(product.categoryName);
    if (!category) {
      throw new Error(`Missing category ${product.categoryName}`);
    }

    await prisma.product.upsert({
      where: {
        name_categoryId: {
          name: product.name,
          categoryId: category.id,
        },
      },
      update: {
        price: product.price,
        isActive: true,
      },
      create: {
        name: product.name,
        categoryId: category.id,
        price: product.price,
        isActive: true,
      },
    });
  }

  console.log("Seed completed: admin/cashier users, categories, and sample products are ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
