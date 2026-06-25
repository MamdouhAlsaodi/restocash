import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

/**
 * Initial staff for the restaurant.
 *
 * Note: this seed only creates users — categories and products are NOT
 * seeded because the owner adds the real menu himself via the API
 * (POST /api/categories, POST /api/products) or Prisma Studio.
 */
const STAFF: Array<{ name: string; email: string; password: string; role: UserRole }> = [
  // Owner — full access to every screen (including user management).
  // Mamdouh can never be demoted to a lower role except by another SUPER_ADMIN.
  {
    name: "Mamdouh (Owner)",
    email: "mamdouh@restocash.local",
    password: "mamdouh10",
    role: UserRole.SUPER_ADMIN,
  },
  // Substitute — can sell, view orders, view reports. NO dashboard, NO user mgmt.
  {
    name: "Yousef",
    email: "yousef@restocash.local",
    password: "yousefLages",
    role: UserRole.CASHIER,
  },
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
  console.log("Seeding initial staff…");

  for (const user of STAFF) {
    const saved = await upsertUser(user);
    console.log(`  ✓ ${saved.email.padEnd(30)} → ${saved.role.padEnd(12)} (${saved.name})`);
  }

  console.log("\nSeed complete. No categories or products were created — add them via:");
  console.log("  • Web UI: http://100.100.143.125:8081  (after login as mamdouh)");
  console.log("  • Prisma Studio: npx prisma studio");
  console.log("  • API: POST /api/categories + POST /api/products (admin auth required)");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });