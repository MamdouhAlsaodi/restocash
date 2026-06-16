# RestoCash — خطة تطوير مفصلة

## 1. الهدف

بناء نظام POS بسيط واحترافي للمطاعم/الكاشير باسم **RestoCash**.

النسخة الأولى ستكون Mobile App للكاشير، لكن المعمارية ستكون **API-first** حتى نستطيع إضافة Web Dashboard لاحقًا بدون إعادة بناء النظام.

```text
Mobile App الآن ─┐
                 ├── REST API ── Business Logic ── PostgreSQL
Web Dashboard لاحقًا ─┘
```

## 2. مبدأ المشروع الأساسي

الـ Backend هو مصدر الحقيقة:

- الأسعار الحقيقية من قاعدة البيانات.
- checkout النهائي يحدث في backend.
- JWT والصلاحيات في backend.
- التقارير من backend.
- الموبايل يعرض ويتفاعل فقط.

الموبايل يمكنه عرض total سريع للمستخدم، لكن عند تأكيد البيع يرسل:

```json
{
  "items": [{ "productId": "...", "quantity": 2 }],
  "paymentMethod": "PIX"
}
```

والـ Backend يعيد حساب كل شيء من قاعدة البيانات.

---

## 3. Tech Stack النهائي

### Monorepo

```text
npm workspaces
```

الهيكل:

```text
restocash/
  apps/
    api/       # Backend API
    mobile/    # Expo React Native app
    web/       # Future Next.js dashboard
  packages/
    shared/    # shared types/constants
    api-client/# future typed API client
  docs/
    architecture/
    plans/
```

### Backend

```text
NestJS
TypeScript
Prisma
PostgreSQL
JWT
bcrypt
class-validator
Jest/Supertest
```

### Mobile

```text
Expo React Native
TypeScript
Expo Router أو React Navigation
SecureStore للـ JWT
AsyncStorage للكاش غير الحساس
```

### Web لاحقًا

```text
Next.js
TypeScript
نفس REST API
نفس shared types
```

---

## 4. مراحل التطوير

## Phase 1 — Project Foundation

### الهدف

إنشاء هيكل monorepo واضح وقابل للتوسع.

### الملفات

```text
package.json
.gitignore
.env.example
apps/api/package.json
apps/mobile/package.json
apps/web/package.json
packages/shared/package.json
packages/api-client/package.json
packages/shared/src/index.ts
```

### Acceptance Criteria

- `npm run typecheck` يعمل من root.
- المجلدات الأساسية موجودة.
- `packages/shared` يحتوي PaymentMethod و UserRole.

---

## Phase 2 — API Foundation

### الهدف

إنشاء Backend أولي يعمل.

### المهام

1. Scaffold NestJS داخل `apps/api`.
2. إضافة endpoint:

```text
GET /health
```

يرجع:

```json
{ "status": "ok" }
```

3. إضافة global validation pipe.
4. إضافة error response موحد.

### Acceptance Criteria

```bash
curl http://localhost:3000/health
```

يرجع status ok.

---

## Phase 3 — Database + Prisma

### الهدف

إنشاء قاعدة بيانات واضحة بالعلاقات الأساسية.

### Models

```text
User
Category
Product
Sale
SaleItem
```

### Enums

```text
UserRole: ADMIN | CASHIER
PaymentMethod: CASH | PIX | CARD_DEBIT | CARD_CREDIT
SaleStatus: COMPLETED | CANCELLED
```

### قاعدة مهمة

في `SaleItem` نحفظ snapshot:

```text
productNameSnapshot
unitPriceSnapshot
quantity
subtotal
```

حتى لو تغير سعر المنتج لاحقًا، البيع القديم يبقى صحيحًا.

### Acceptance Criteria

```bash
npx prisma validate
npx prisma migrate dev --name init
```

---

## Phase 4 — Auth + Roles

### الهدف

إضافة login وJWT وصلاحيات.

### Endpoints

```text
POST /api/auth/login
GET  /api/auth/me
```

### Roles

```text
ADMIN
CASHIER
```

### Rules

- Admin يدير المنتجات والتقارير.
- Cashier يعمل checkout فقط.
- كلمات المرور تخزن hash عبر bcrypt.

### Acceptance Criteria

- login صحيح يرجع token.
- login خاطئ يرجع 401.
- `/me` بدون token يرجع 401.

---

## Phase 5 — Products + Categories

### الهدف

توفير المنتجات للكاشير وإدارتها من Admin.

### Endpoints

```text
GET   /api/categories
POST  /api/categories        Admin only
PATCH /api/categories/:id    Admin only

GET   /api/products
POST  /api/products          Admin only
PATCH /api/products/:id      Admin only
```

### Rules

- Cashier لا يعدل المنتجات.
- المنتج الذي له مبيعات لا يحذف hard delete.
- نستخدم `isActive=false` للتعطيل.

---

## Phase 6 — Checkout Backend

### الهدف

أهم جزء في المشروع: إنشاء البيع بشكل صحيح وآمن.

### Endpoint

```text
POST /api/sales/checkout
```

### Flow

```text
1. التحقق من JWT.
2. التحقق من role: ADMIN أو CASHIER.
3. رفض السلة الفارغة.
4. رفض quantity <= 0.
5. جلب المنتجات من DB.
6. رفض المنتجات غير الموجودة أو inactive.
7. حساب السعر من DB وليس من mobile.
8. إنشاء Sale.
9. إنشاء SaleItems مع snapshots.
10. تنفيذ كل شيء داخل Prisma transaction.
```

### Tests ضرورية

- empty cart fails.
- invalid quantity fails.
- inactive product fails.
- backend recalculates total from DB.
- snapshots are saved.

---

## Phase 7 — Reports

### الهدف

تقرير يومي حسب طريقة الدفع.

### Endpoint

```text
GET /api/reports/daily?date=YYYY-MM-DD
```

### Response مثال

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

### Rules

- البيع الملغي لا يدخل في التقرير.
- timezone للمطعم يضاف قبل الاستخدام الحقيقي.

---

## Phase 8 — Mobile Foundation

### الهدف

إنشاء تطبيق Expo وربطه بالـ API.

### Screens

```text
Login
Cashier
Cart
Payment
Daily Sales
```

### API files

```text
apps/mobile/src/api/client.ts
apps/mobile/src/api/auth.api.ts
apps/mobile/src/api/products.api.ts
apps/mobile/src/api/sales.api.ts
apps/mobile/src/api/reports.api.ts
```

### قاعدة

لا نكتب raw `fetch` داخل الشاشات. كل شيء عبر API modules.

---

## Phase 9 — Mobile POS Flow

### Cashier Screen

- categories في الأعلى.
- products grid.
- ضغط المنتج يضيف للسلة.
- cart summary واضح.

### Cart Screen

- items.
- + و -.
- remove item.
- clear cart.
- total preview.

### Payment Screen

- Dinheiro / CASH
- Pix / PIX
- Débito / CARD_DEBIT
- Crédito / CARD_CREDIT

عند success:

- clear cart.
- show sale confirmation.

عند failure:

- لا نمسح السلة.
- نعرض رسالة واضحة.

---

## Phase 10 — Hardening

### Sale cancellation

```text
POST /api/sales/:id/cancel
```

- Admin only.
- requires reason.
- status becomes CANCELLED.
- reports exclude cancelled sales.

### Human sale number

لاحقًا:

```text
20260616-0001
```

مع الانتباه للتزامن.

---

## Phase 11 — Web Dashboard لاحقًا

لا نبدأ به حتى يعمل Mobile MVP.

سيكون:

```text
Next.js + TypeScript
```

الصفحات:

- Login
- Products
- Categories
- Sales
- Reports
- Users

---

## 5. أول Milestone

نعتبر milestone الأول مكتملًا عندما:

```text
Admin يستطيع login من API.
Cashier يستطيع login من API.
Seed categories/products موجود.
Cashier يستطيع checkout من API.
Backend يحفظ Sale + SaleItems snapshots.
Daily report يرجع totals by payment method.
Backend tests تمر.
```

بعدها نبدأ الموبايل بتركيز.

---

## 6. أوامر التحقق الحالية

```bash
npm run typecheck
npm test
```

---

## 7. ملاحظة مهمة لممدوح

هذه المرحلة صعبة لأنها مرحلة حدود ومسؤوليات. إذا شعرت أن المشروع كبير، ارجع دائمًا للسؤال:

```text
هل هذه القاعدة مكانها backend أم mobile؟
```

غالبًا إذا كانت حسابات، صلاحيات، حفظ بيانات، أو تقرير: مكانها backend.

إذا كانت عرض، أزرار، تجربة مستخدم: مكانها mobile.
