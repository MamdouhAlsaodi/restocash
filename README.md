# RestoCash

**RestoCash** is an API-first Point of Sale (POS) system designed for small restaurants, cafés, and cashier workflows.

The first client will be a mobile app for fast in-restaurant selling, but the architecture is intentionally **mobile-first, not mobile-only**. The backend is the source of truth, so a future web dashboard can be added without rewriting the business logic.

## Language

- [العربية](README.ar.md)
- [Português do Brasil](README.pt-BR.md)

---

## Why this project exists

RestoCash was created as a learning-focused but realistic software project. The goal is to practice the engineering concepts that matter in real backend/mobile systems:

- Clean API design
- Database relationships
- Authentication and authorization
- Role-based access control
- Business rules separated from UI
- Safe checkout calculations
- Reports and audit-friendly sales records
- A structure that can grow from mobile app to full platform

Instead of building a UI-only demo, RestoCash focuses on the architecture behind a real POS product.

---

## Product vision

RestoCash starts as a simple restaurant cashier app:

1. Cashier logs in.
2. Cashier selects products.
3. Cart calculates a quick preview total.
4. Backend performs the final checkout calculation.
5. Sale is saved with product snapshots.
6. Daily reports show totals by payment method.

Later, the same backend can power:

- A web dashboard for owners/admins
- Product and category management
- Sales history
- Cashier management
- Daily/monthly reports
- Sale cancellation with reasons
- Inventory tracking
- Multi-branch support

---

## Architecture

```text
Mobile App now ─┐
                ├── REST API ── Business Logic ── PostgreSQL
Web Dashboard later ─┘
```

The UI is not trusted as the final source of truth.

For example, during checkout the mobile app sends product IDs and quantities. The backend loads current product prices from the database, calculates totals, saves the sale, and stores product snapshots.

This prevents old sales from changing if product prices change later.

---

## Planned tech stack

### Monorepo

- npm workspaces
- `apps/*` for applications
- `packages/*` for shared libraries

### Backend API

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- class-validator / class-transformer
- Jest / Supertest later

### Mobile app

- Expo
- React Native
- TypeScript
- SecureStore for JWT storage
- API client layer under `src/api`

### Future web dashboard

- Next.js
- TypeScript
- Same REST API
- Shared types from `packages/shared`

---

## Current repository structure

```text
restocash/
  apps/
    api/       # NestJS API foundation
    mobile/    # Future Expo mobile app
    web/       # Future web dashboard

  packages/
    shared/    # Shared domain constants and types
    api-client/# Future typed API client

  docs/
    architecture/
    plans/

  plan.md
  README.md
  README.ar.md
  README.pt-BR.md
```

---

## MVP scope

The first usable version will include:

- Login
- Roles: `ADMIN` and `CASHIER`
- Categories
- Products
- Cart
- Checkout
- Payment methods:
  - `CASH`
  - `PIX`
  - `CARD_DEBIT`
  - `CARD_CREDIT`
- Sale history
- Daily sales report

---

## Core business rules

### Backend owns checkout

The mobile app may show a preview total, but the backend recalculates the official total from the database.

### Sale items store snapshots

Each sale item stores:

- Product name at sale time
- Unit price at sale time
- Quantity
- Subtotal

This keeps historical reports correct even when products are renamed or prices change.

### Products are disabled, not hard deleted

Products with sales history should not be deleted permanently. They should be marked as inactive.

### Role-based access

- `ADMIN`: manages products, categories, reports, and future users.
- `CASHIER`: creates sales and uses the cashier flow.

---

## Development status

Current foundation completed:

- Monorepo structure
- Root workspace scripts
- Shared domain constants
- Initial NestJS API foundation
- `/api/health` endpoint
- Prisma/PostgreSQL schema foundation
- Seed script for admin/cashier users, categories, and sample products
- Auth foundation with JWT login, `/api/auth/me`, current-user decorator, and roles guard
- Categories API with authenticated reads and admin-only create/update
- Products API with authenticated reads and admin-only create/update
- Checkout API with backend-owned totals and SaleItem snapshots
- Daily reports API with totals by payment method
- Detailed planning documents

Verified locally:

```bash
npm --workspace @restocash/api run prisma:validate
npm --workspace @restocash/api run prisma:generate
npm run typecheck
npm test
npm --workspace @restocash/api run build
# Checkout/report integration tests verified with Jest/Supertest and a temporary PostgreSQL container:
# login -> POST /api/sales/checkout -> persisted Sale/SaleItem snapshots
```

Health endpoint:

```text
GET /api/health
```

Returns:

```json
{"status":"ok","service":"restocash-api"}
```

---

## Getting started

Install dependencies:

```bash
npm install
```

Run type checks:

```bash
npm run typecheck
```

Run tests/placeholders:

```bash
npm test
```

Build the API:

```bash
npm --workspace @restocash/api run build
```

Run the API in development:

```bash
npm run dev:api
```

Then open:

```text
http://localhost:3000/api/health
```

---

## Roadmap

### Phase 1 — Foundation

- Monorepo
- Shared types
- API health endpoint

### Phase 2 — Database

- PostgreSQL
- Prisma schema
- Initial migrations
- Seed users/products

### Phase 3 — Authentication

- Login
- JWT
- Password hashing
- Current user endpoint
- Roles guard

### Phase 4 — Catalog

- Categories API
- Products API
- Admin-only mutations

### Phase 5 — Checkout

- Checkout DTO
- Backend total calculation
- Prisma transaction
- Sale and SaleItem snapshots
- Tests for checkout rules

### Phase 6 — Reports

- Daily report endpoint
- Totals by payment method
- Exclude cancelled sales

### Phase 7 — Mobile MVP

- Login screen
- Cashier screen
- Cart screen
- Payment screen
- Daily sales screen

### Phase 8 — Future dashboard

- Next.js dashboard
- Product management
- Reports UI
- Users/cashiers management

---

## Repository philosophy

RestoCash is built to be educational and realistic at the same time.

The project intentionally avoids shortcuts such as putting business logic inside the UI. The purpose is to build the kind of structure that can survive future growth.
