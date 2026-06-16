# RestoCash / HybridPOS — API-First Mobile/Web Ready Architecture

## الهدف

نبني النظام بحيث يكون **Backend API هو مركز الحقيقة**، وتكون الواجهة الأمامية قابلة للتغيير بسهولة:

- اليوم: تطبيق موبايل Expo React Native للكاشير.
- لاحقًا: Web Dashboard للإدارة.
- كلاهما يستخدمان نفس API ونفس قواعد الـ business logic.

بهذا الشكل، إذا غيرنا الواجهة من Mobile إلى Web أو أضفنا الاثنين معًا، لا نعيد كتابة الحسابات أو قواعد البيع أو صلاحيات المستخدمين.

---

## القرار المعماري الأساسي

```text
Mobile App  ─┐
             ├── HTTP JSON API ── Business Logic ── Database
Web App     ─┘
```

الـ UI لا يحسب الحقيقة النهائية وحده. الموبايل يمكنه عرض total سريع للمستخدم، لكن عند checkout يرسل items إلى backend، والـ backend يعيد حساب السعر ويحفظ البيع.

---

## Monorepo مقترح

```text
restocash/
  apps/
    api/              # Backend API: NestJS أو Express + TypeScript
    mobile/           # Expo React Native POS app
    web/              # Future web dashboard

  packages/
    shared/           # Types, DTOs, validation schemas, API contracts
    api-client/       # Client generated/typed يستخدمه mobile و web

  docs/
    architecture/
    plans/
```

---

## Backend feature-based structure

```text
apps/api/src/
  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.dto.ts
      auth.guard.ts

    users/
      users.controller.ts
      users.service.ts
      users.repository.ts
      users.dto.ts

    categories/
      categories.controller.ts
      categories.service.ts
      categories.repository.ts
      categories.dto.ts

    products/
      products.controller.ts
      products.service.ts
      products.repository.ts
      products.dto.ts

    sales/
      sales.controller.ts
      sales.service.ts
      sales.repository.ts
      sales.dto.ts

    reports/
      reports.controller.ts
      reports.service.ts
      reports.repository.ts
      reports.dto.ts

  shared/
    errors/
    middleware/
    guards/
    utils/
    config/

  database/
    prisma.service.ts
    migrations/
```

كل feature في ملفاته الخاصة. هذا يسهل القراءة والتوسع.

---

## Frontend قابل للتبديل لاحقًا

### Mobile الآن

```text
apps/mobile/src/
  features/
    auth/
    cashier/
    cart/
    sales/
    reports/
    products/

  api/
    client.ts
    products.api.ts
    sales.api.ts

  components/
  theme/
```

### Web لاحقًا

```text
apps/web/src/
  features/
    auth/
    dashboard/
    products/
    sales/
    reports/

  api/
    client.ts
```

المهم: `apps/mobile` و `apps/web` لا يملكان business logic الحقيقي؛ هما فقط واجهات تستخدم API.

---

## Shared API contracts

نستخدم `packages/shared` لتعريف الأنواع والـ DTOs:

```text
packages/shared/src/
  payment-method.ts
  product.dto.ts
  sale.dto.ts
  report.dto.ts
  user-role.ts
```

مثال:

```ts
export type PaymentMethod =
  | "CASH"
  | "PIX"
  | "CARD_DEBIT"
  | "CARD_CREDIT";

export type UserRole = "ADMIN" | "CASHIER";
```

لاحقًا ممكن نضيف OpenAPI أو Zod schemas لتوليد client تلقائيًا للموبايل والويب.

---

## قواعد مهمة

1. **لا تعتمد على UI في الحساب النهائي**
   - الـ UI يعرض رقمًا سريعًا فقط.
   - الـ API يعيد حساب total قبل حفظ البيع.

2. **SaleItem snapshot**
   - عند حفظ البيع، نخزن `productName` و `unitPrice` وقت البيع.
   - لو تغير سعر المنتج لاحقًا، المبيعات القديمة تبقى صحيحة.

3. **لا نحذف منتج عليه مبيعات**
   - نستخدم `isActive = false` بدل delete.

4. **JWT + Roles من البداية**
   - Admin: إدارة المنتجات والتقارير.
   - Cashier: إنشاء المبيعات فقط.

5. **Mobile-first وليس mobile-only**
   - التصميم الأول للموبايل، لكن الـ API جاهز للويب لاحقًا.
