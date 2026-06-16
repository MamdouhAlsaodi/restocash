# RestoCash Development Roadmap Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Build RestoCash as an API-first POS system: mobile app now, web dashboard later, with backend as the source of truth.

**Architecture:** Monorepo with `apps/api` for backend, `apps/mobile` for Expo app, future `apps/web`, and shared packages for contracts/types. Backend owns all business rules, checkout calculations, permissions, and persistence. Mobile/web only consume the API.

**Tech Stack:** NestJS + TypeScript, Prisma + PostgreSQL, JWT + bcrypt, Expo React Native + TypeScript, npm/pnpm workspaces, Jest/Supertest.

---

## Phase 0 — Project Discipline and Ground Rules

**Objective:** Make the hardest part manageable by using small tasks, clear acceptance criteria, and no guessing.

**Rules:**
- One feature at a time.
- Backend first, mobile second.
- Every business rule is tested in backend.
- UI never becomes the source of truth.
- Do not build web dashboard until mobile MVP works.
- Commit after each small milestone.

**Definition of done for any feature:**
1. API endpoint exists.
2. Validation exists.
3. Authorization exists when needed.
4. Tests cover happy path + at least one failure case.
5. Mobile uses the endpoint through `src/api/*`, not raw fetch inside screens.
6. Manual verification command passes.

---

## Phase 1 — Monorepo Foundation

### Task 1.1: Create workspace structure

**Objective:** Prepare folders without implementing business logic yet.

**Files:**
- Create: `package.json`
- Create: `apps/api/`
- Create: `apps/mobile/`
- Create: `apps/web/.gitkeep`
- Create: `packages/shared/`
- Create: `packages/api-client/`

**Expected structure:**

```text
restocash/
  apps/
    api/
    mobile/
    web/
  packages/
    shared/
    api-client/
  docs/
    architecture/
    plans/
```

**Verification:**

```bash
find apps packages -maxdepth 2 -type d | sort
```

---

### Task 1.2: Add root tooling

**Objective:** Add shared scripts for development and checks.

**Files:**
- Modify: `package.json`
- Create: `.gitignore`
- Create: `.env.example`

**Scripts target:**

```json
{
  "scripts": {
    "dev:api": "npm --workspace apps/api run start:dev",
    "dev:mobile": "npm --workspace apps/mobile run start",
    "test": "npm --workspaces run test",
    "typecheck": "npm --workspaces run typecheck",
    "lint": "npm --workspaces run lint"
  }
}
```

**Verification:**

```bash
npm run typecheck
```

Expected initially: no workspaces or placeholder success after setup.

---

## Phase 2 — Backend Foundation

### Task 2.1: Scaffold NestJS API

**Objective:** Create `apps/api` as the backend source of truth.

**Files:**
- Create/modify under: `apps/api/`

**Install target packages:**
- `@nestjs/common`
- `@nestjs/core`
- `@nestjs/platform-express`
- `@nestjs/config`
- `class-validator`
- `class-transformer`
- `jsonwebtoken` or `@nestjs/jwt`
- `bcrypt`
- `prisma`
- `@prisma/client`

**Verification:**

```bash
cd apps/api
npm run start:dev
curl http://localhost:3000/health
```

Expected:

```json
{"status":"ok"}
```

---

### Task 2.2: Add global validation and error shape

**Objective:** Ensure invalid input fails consistently.

**Files:**
- Modify: `apps/api/src/main.ts`
- Create: `apps/api/src/shared/filters/http-exception.filter.ts`

**Acceptance criteria:**
- Unknown fields rejected or stripped.
- DTO validation errors return predictable JSON.
- API does not leak stack traces in normal responses.

**Verification:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Expected: `400` with validation message.

---

## Phase 3 — Database + Prisma

### Task 3.1: Configure PostgreSQL and Prisma

**Objective:** Make database schema explicit and migratable.

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/.env.example`

**Initial models:**
- `User`
- `Category`
- `Product`
- `Sale`
- `SaleItem`

**Core enum values:**

```prisma
enum UserRole {
  ADMIN
  CASHIER
}

enum PaymentMethod {
  CASH
  PIX
  CARD_DEBIT
  CARD_CREDIT
}

enum SaleStatus {
  COMPLETED
  CANCELLED
}
```

**Verification:**

```bash
cd apps/api
npx prisma validate
npx prisma migrate dev --name init
```

Expected: migration succeeds.

---

### Task 3.2: Add seed data

**Objective:** Make development usable immediately.

**Files:**
- Create: `apps/api/prisma/seed.ts`

**Seed data:**
- Admin user
- Cashier user
- 3 categories
- 8 sample products

**Verification:**

```bash
cd apps/api
npx prisma db seed
npx prisma studio
```

Expected: users/products visible.

---

## Phase 4 — Shared Types and Contracts

### Task 4.1: Create shared domain constants

**Objective:** Avoid duplicated magic strings between backend/mobile/web.

**Files:**
- Create: `packages/shared/src/payment-method.ts`
- Create: `packages/shared/src/user-role.ts`
- Create: `packages/shared/src/index.ts`

**Required exports:**

```ts
export const PAYMENT_METHODS = ["CASH", "PIX", "CARD_DEBIT", "CARD_CREDIT"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const USER_ROLES = ["ADMIN", "CASHIER"] as const;
export type UserRole = (typeof USER_ROLES)[number];
```

**Verification:**

```bash
npm --workspace packages/shared run typecheck
```

---

## Phase 5 — Authentication and Roles

### Task 5.1: Build password hashing utility

**Objective:** Never store plaintext passwords.

**Files:**
- Create: `apps/api/src/shared/security/password.service.ts`
- Test: `apps/api/src/shared/security/password.service.spec.ts`

**Test cases:**
- Hash is not equal to password.
- Correct password verifies.
- Wrong password fails.

**Verification:**

```bash
cd apps/api
npm test -- password.service.spec.ts
```

---

### Task 5.2: Build Auth module

**Objective:** Login returns JWT for valid users.

**Files:**
- Create: `apps/api/src/modules/auth/auth.module.ts`
- Create: `apps/api/src/modules/auth/auth.controller.ts`
- Create: `apps/api/src/modules/auth/auth.service.ts`
- Create: `apps/api/src/modules/auth/dto/login.dto.ts`
- Create: `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- Create: `apps/api/src/modules/auth/decorators/current-user.decorator.ts`

**Endpoints:**

```text
POST /api/auth/login
GET  /api/auth/me
```

**Acceptance criteria:**
- Invalid credentials return `401`.
- Valid credentials return access token and user.
- `/me` requires token.

**Verification:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@restocash.local","password":"admin123"}'
```

Expected: JSON with `accessToken`.

---

### Task 5.3: Add role guard

**Objective:** Protect admin-only endpoints later.

**Files:**
- Create: `apps/api/src/modules/auth/decorators/roles.decorator.ts`
- Create: `apps/api/src/modules/auth/guards/roles.guard.ts`

**Acceptance criteria:**
- Admin can access admin endpoint.
- Cashier gets `403`.

---

## Phase 6 — Categories and Products

### Task 6.1: Category read endpoint

**Objective:** Mobile can list active categories.

**Files:**
- Create: `apps/api/src/modules/categories/*`

**Endpoint:**

```text
GET /api/categories
```

**Rules:**
- Return active categories by `sortOrder`.

---

### Task 6.2: Admin category mutation endpoints

**Objective:** Admin can add/edit/disable categories.

**Endpoints:**

```text
POST  /api/categories
PATCH /api/categories/:id
```

**Rules:**
- Admin only.
- Cashier forbidden.
- `isActive=false` instead of hard delete.

---

### Task 6.3: Product read endpoint

**Objective:** Mobile cashier screen can load product buttons.

**Endpoint:**

```text
GET /api/products?categoryId=...
```

**Rules:**
- Return only active products by default.
- Include category data if useful.

---

### Task 6.4: Admin product mutation endpoints

**Objective:** Admin can add/edit/disable products.

**Endpoints:**

```text
POST  /api/products
PATCH /api/products/:id
```

**Validation:**
- name required
- price > 0
- category exists

---

## Phase 7 — Checkout: The Most Important Backend Feature

### Task 7.1: Define checkout DTO

**Objective:** Mobile sends only product IDs and quantities; backend calculates truth.

**Files:**
- Create: `apps/api/src/modules/sales/dto/checkout.dto.ts`

**Shape:**

```ts
{
  items: [
    { productId: string, quantity: number }
  ],
  paymentMethod: "CASH" | "PIX" | "CARD_DEBIT" | "CARD_CREDIT"
}
```

**Validation:**
- items not empty
- quantity integer > 0
- payment method valid

---

### Task 7.2: Write checkout calculation tests

**Objective:** Prove backend recalculates total and snapshots product data.

**Test file:**
- `apps/api/src/modules/sales/sales.service.spec.ts`

**Test cases:**
1. Empty cart fails.
2. Quantity `0` fails.
3. Inactive product fails.
4. Backend calculates total from DB price.
5. SaleItem stores `productNameSnapshot` and `unitPriceSnapshot`.

---

### Task 7.3: Implement checkout transaction

**Objective:** Save Sale and SaleItems atomically.

**Files:**
- Create: `apps/api/src/modules/sales/sales.module.ts`
- Create: `apps/api/src/modules/sales/sales.controller.ts`
- Create: `apps/api/src/modules/sales/sales.service.ts`

**Endpoint:**

```text
POST /api/sales/checkout
```

**Critical rule:** Use Prisma transaction.

**Pseudo-flow:**

```text
1. Validate user is ADMIN or CASHIER.
2. Load products by IDs from DB.
3. Reject missing/inactive products.
4. Calculate each subtotal from DB price.
5. Calculate total.
6. Create Sale.
7. Create SaleItems with snapshots.
8. Return sale summary.
```

**Verification:**

```bash
curl -X POST http://localhost:3000/api/sales/checkout \
  -H 'Authorization: Bearer TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":"...","quantity":2}],"paymentMethod":"PIX"}'
```

Expected: sale with total and items.

---

## Phase 8 — Reports

### Task 8.1: Daily report endpoint

**Objective:** Admin can see daily sales totals by payment method.

**Endpoint:**

```text
GET /api/reports/daily?date=YYYY-MM-DD
```

**Return shape:**

```json
{
  "date": "2026-06-16",
  "total": 120.50,
  "count": 8,
  "byPaymentMethod": {
    "CASH": 30,
    "PIX": 50,
    "CARD_DEBIT": 20,
    "CARD_CREDIT": 20.5
  }
}
```

**Rules:**
- Exclude cancelled sales.
- Respect local restaurant timezone later.
- Start with server date for MVP, document timezone risk.

---

## Phase 9 — Mobile Foundation

### Task 9.1: Scaffold Expo app

**Objective:** Create mobile shell.

**Files:**
- Create under: `apps/mobile/`

**Screens:**
- Login
- Cashier
- Cart
- Payment
- Daily Sales

**Verification:**

```bash
cd apps/mobile
npx expo start
```

Expected: app opens.

---

### Task 9.2: Add API client and token storage

**Objective:** Mobile talks to backend cleanly.

**Files:**
- Create: `apps/mobile/src/api/client.ts`
- Create: `apps/mobile/src/api/auth.api.ts`
- Create: `apps/mobile/src/storage/auth-token.ts`

**Rules:**
- Store JWT in SecureStore.
- All API calls go through `client.ts`.
- No raw fetch inside screens.

---

### Task 9.3: Build Login screen

**Objective:** User can authenticate from mobile.

**Acceptance criteria:**
- Email/password fields.
- Loading state.
- Friendly error message.
- Saves token on success.
- Navigates to Cashier screen.

---

## Phase 10 — Mobile POS Flow

### Task 10.1: Build Cashier screen

**Objective:** Cashier can pick products quickly.

**UI:**
- Category row at top.
- Product grid.
- Cart summary fixed near bottom.

**Rules:**
- Products loaded from API.
- Press product adds to local cart.
- UI total is preview only.

---

### Task 10.2: Build Cart screen

**Objective:** Cashier can review and modify order.

**Actions:**
- Increase quantity.
- Decrease quantity.
- Remove item.
- Clear cart.
- Continue to payment.

---

### Task 10.3: Build Payment screen

**Objective:** Cashier chooses payment method and confirms sale.

**Buttons:**
- Dinheiro / CASH
- Pix / PIX
- Débito / CARD_DEBIT
- Crédito / CARD_CREDIT

**On confirm:**
- POST `/api/sales/checkout`
- Clear cart only after success.
- Show sale number/confirmation.

---

### Task 10.4: Build Daily Sales screen

**Objective:** Admin or cashier can see today's totals.

**Data:**
- Total geral
- Total by payment method
- Count of sales

---

## Phase 11 — Hardening and Real-World Rules

### Task 11.1: Sale cancellation

**Objective:** Admin can cancel wrong sale without deleting history.

**Endpoint:**

```text
POST /api/sales/:id/cancel
```

**Rules:**
- Admin only.
- Requires reason.
- Cancelled sales excluded from reports.

---

### Task 11.2: Better sale numbering

**Objective:** Human-friendly sale numbers.

**Example:**

```text
20260616-0001
20260616-0002
```

**Risk:** Needs care under concurrent checkouts.

---

### Task 11.3: Offline tolerance later

**Objective:** Decide if restaurant needs offline sales.

**Not MVP unless required.** Offline POS is hard because it needs sync conflict handling. For MVP, require API connection.

---

## Phase 12 — Future Web Dashboard

**Do not start until mobile MVP works.**

Future stack:

```text
Next.js + TypeScript
```

Future pages:
- Login
- Products management
- Categories management
- Sales list
- Reports dashboard
- Users/cashiers management

Because backend is API-first, web will reuse:
- auth endpoints
- product endpoints
- report endpoints
- shared types

---

## Main Risks

1. **Trying to build mobile and backend together too quickly**
   - Mitigation: backend feature first, mobile screen second.

2. **Putting checkout logic in mobile**
   - Mitigation: backend recalculates total from DB.

3. **Overbuilding admin dashboard too early**
   - Mitigation: keep web as future phase.

4. **Skipping tests for checkout**
   - Mitigation: checkout must have tests before mobile payment screen.

5. **Timezone in reports**
   - Mitigation: document in MVP, add restaurant timezone before real use.

---

## Recommended Execution Order

1. Phase 1 — Monorepo.
2. Phase 2 — API foundation.
3. Phase 3 — Prisma/PostgreSQL.
4. Phase 5 — Auth.
5. Phase 6 — Products/Categories.
6. Phase 7 — Checkout.
7. Phase 8 — Reports.
8. Phase 9 — Mobile foundation.
9. Phase 10 — Mobile POS flow.
10. Phase 11 — Hardening.
11. Phase 12 — Web dashboard later.

---

## First Milestone Definition

**Milestone 1 is complete when:**

```text
Admin can login through API.
Cashier can login through API.
API has seeded categories/products.
Cashier can call checkout endpoint with product IDs.
Backend saves Sale + SaleItems with snapshots.
Daily report returns totals by payment method.
All backend tests pass.
```

Only after this milestone should mobile UI become the focus.

---

## Emotional/learning note for Mamdouh

This is the hardest phase because it is not just coding; it is deciding boundaries. The safest way is to make the backend the brain, then build the mobile app as a clean client. If a step feels unclear, do not rush; reduce it to one endpoint, one DTO, one test, one screen.
