# RestoCash API Test Hardening Implementation Plan

> **For Hermes:** Use the configured Claude Code workflow (`source ~/.claude/providers.sh && glm -p ...`) for implementation when available, then verify with real commands.

**Goal:** Replace placeholder API tests with real Jest/Supertest integration tests that protect checkout and daily report behavior.

**Architecture:** Keep tests inside `apps/api` so they can use the Nest `AppModule`, Prisma, and the existing workspace commands. Use an isolated test database supplied by `DATABASE_URL`; tests reset only application tables and seed minimal users/categories/products. HTTP assertions exercise the real API flow: login → products → checkout → reports.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest, ts-jest, Supertest, npm workspaces.

---

## Phase A — Test Harness Foundation

### Task 1: Add API test dependencies and scripts

**Objective:** Replace the placeholder API test script with a real Jest integration test runner.

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/jest.config.js`
- Create: `apps/api/test/setup.ts` if needed

**Steps:**
1. Install dev dependencies in the API workspace: `jest`, `ts-jest`, `@types/jest`, `supertest`, `@types/supertest`.
2. Change `apps/api/package.json` test script to run Jest.
3. Add `test:integration` alias for clarity.
4. Verify `npm --workspace @restocash/api run test -- --runInBand` starts Jest.

### Task 2: Add reusable integration test helpers

**Objective:** Make API tests deterministic and avoid duplicated seed/login code.

**Files:**
- Create: `apps/api/test/helpers/test-app.ts`
- Create: `apps/api/test/helpers/test-data.ts`

**Steps:**
1. Create Nest app from `AppModule` with the same global prefix and validation pipe as `src/main.ts`.
2. Add helpers for truncating `saleItem`, `sale`, `product`, `category`, and `user` tables.
3. Add helpers for creating admin/cashier users with hashed passwords.
4. Add helpers for login and Authorization headers.

---

## Phase B — Checkout Coverage

### Task 3: Checkout success test

**Objective:** Prove the backend recalculates totals from DB and stores snapshots.

**Files:**
- Create: `apps/api/test/sales.checkout.int-spec.ts`

**Steps:**
1. Seed admin, category, and product with price `28.90`.
2. Login admin.
3. POST `/api/sales/checkout` with quantity `2` and `PIX`.
4. Assert response total is `57.8`/`57.80`, one item exists, and snapshot name/price match DB values.
5. Read Prisma DB record and assert persisted Sale/SaleItem values.

### Task 4: Checkout validation and business rule tests

**Objective:** Protect the dangerous edge cases documented in `plan.md`.

**Files:**
- Modify: `apps/api/test/sales.checkout.int-spec.ts`

**Cases:**
1. Empty cart returns `400`.
2. Quantity `0` returns `400`.
3. Missing product ID returns `400`.
4. Inactive product ID returns `400`.
5. Cashier role can checkout successfully.

---

## Phase C — Report Coverage

### Task 5: Daily report success test

**Objective:** Prove reports aggregate completed sales by payment method.

**Files:**
- Create: `apps/api/test/reports.daily.int-spec.ts`

**Steps:**
1. Seed admin and products.
2. Create multiple sales using checkout or Prisma records.
3. GET `/api/reports/daily?date=YYYY-MM-DD` as admin.
4. Assert count, total, and `byPaymentMethod` values.

### Task 6: Report access/validation tests

**Objective:** Protect report auth and cancellation rules.

**Files:**
- Modify: `apps/api/test/reports.daily.int-spec.ts`

**Cases:**
1. Cashier cannot access report (`403`).
2. Invalid date format returns `400`.
3. `CANCELLED` sale is excluded from totals.

---

## Phase D — Verification and Documentation

### Task 7: Run full local gates

**Objective:** Prove the codebase remains healthy.

**Commands:**
```bash
npm run typecheck
npm --workspace @restocash/api run build
npm --workspace @restocash/api run test -- --runInBand
npm test
```

### Task 8: Update project docs and push

**Objective:** Make the repo status truthful.

**Files:**
- Modify: `README.md`
- Modify: `plan.md`

**Steps:**
1. Replace placeholder-test wording with the new real test coverage.
2. Commit with `test: add api integration coverage`.
3. Push to `origin/main`.
4. Verify with `git status --short --branch` and raw GitHub file fetch.

---

## Immediate start

Begin with Phase A and implement the test harness, then add the checkout success test first. Do not move to mobile until checkout/report tests are real and passing.
