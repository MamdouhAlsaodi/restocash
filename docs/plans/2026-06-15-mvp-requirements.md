# RestoCash MVP Requirements

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** بناء تطبيق موبايل POS بسيط لحساب الطلبات وتخزين المبيعات اليومية حسب طريقة الدفع.

**Architecture:** API-first. الموبايل والويب لاحقًا يستهلكان نفس backend API. كل business logic الحساس مثل checkout والحساب النهائي والصلاحيات يكون في backend.

**Tech Stack المقترح:** Expo React Native + TypeScript للموبايل، NestJS أو Express TypeScript للـ API، PostgreSQL + Prisma للبيانات، JWT للـ Auth.

---

## MVP Scope

أول نسخة تركّز على:

1. Login بسيط.
2. Products + Categories.
3. Cart لإضافة الأصناف بسرعة.
4. Checkout مع اختيار طريقة الدفع.
5. حفظ المبيعات اليومية.
6. Daily report حسب نوع الدفع.
7. Roles: Admin و Cashier.

---

## Payment methods

نبدأ بهذه القيم:

```text
CASH
PIX
CARD_DEBIT
CARD_CREDIT
```

هذا أسهل من `CARD + cardType` في البداية، ويجعل تقرير اليوم واضحًا.

---

## Core entities

### User

```text
id
name
email
passwordHash
role: ADMIN | CASHIER
createdAt
updatedAt
```

### Category

```text
id
name
sortOrder
isActive
createdAt
updatedAt
```

### Product

```text
id
name
categoryId
price
isActive
createdAt
updatedAt
```

### Sale

```text
id
saleNumber
totalAmount
paymentMethod: CASH | PIX | CARD_DEBIT | CARD_CREDIT
status: COMPLETED | CANCELLED
createdByUserId
createdAt
cancelledAt
cancelReason
```

### SaleItem

```text
id
saleId
productId
productNameSnapshot
unitPriceSnapshot
quantity
subtotal
```

---

## Business rules

### Cart

- لا يمكن checkout إذا السلة فارغة.
- الكمية يجب أن تكون أكبر من صفر.
- يمكن زيادة وتقليل الكمية.
- يمكن حذف منتج من السلة.
- يمكن مسح السلة بالكامل.

### Checkout

- الموبايل يعرض total سريع للمستخدم.
- backend يعيد حساب total من database قبل حفظ البيع.
- البيع يحفظ مع snapshots للمنتجات:
  - `productNameSnapshot`
  - `unitPriceSnapshot`
- تغيير سعر المنتج لاحقًا لا يغير المبيعات القديمة.

### Products

- Cashier لا يعدل المنتجات.
- Admin فقط يستطيع إضافة/تعديل/تعطيل المنتجات.
- المنتج الذي عليه مبيعات لا نحذفه فعليًا؛ فقط `isActive = false`.

### Sales

- البيع المكتمل لا يحذف.
- يمكن لاحقًا إضافة cancel مع سبب.
- البيع الملغي لا يدخل في تقرير اليوم.

---

## API endpoints المقترحة

### Auth

```text
POST /api/auth/login
GET  /api/auth/me
```

### Categories

```text
GET  /api/categories
POST /api/categories          Admin only
PATCH /api/categories/:id     Admin only
```

### Products

```text
GET  /api/products
POST /api/products            Admin only
PATCH /api/products/:id       Admin only
```

### Sales

```text
POST /api/sales/checkout      Cashier/Admin
GET  /api/sales               Admin أو حسب الصلاحية
GET  /api/sales/:id           Admin/Cashier owner
POST /api/sales/:id/cancel    Admin only لاحقًا
```

### Reports

```text
GET /api/reports/daily?date=YYYY-MM-DD
```

---

## Mobile screens

### 1. Login Screen

- Email
- Password
- Login button

### 2. Cashier Screen

- Categories بالأعلى.
- Product buttons في grid.
- زر واضح للسلة والمجموع.
- الضغط على المنتج يضيفه للسلة.

### 3. Cart Screen

- قائمة items.
- أزرار `+` و `-`.
- حذف item.
- total واضح.
- زر checkout.

### 4. Payment Screen

- total.
- أزرار:
  - Dinheiro
  - Pix
  - Débito
  - Crédito
- زر Confirmar Venda.

### 5. Daily Sales Screen

يعرض:

```text
Total geral
Dinheiro
Pix
Débito
Crédito
Número de vendas
Ticket médio
```

### 6. Product Management Screen

لـ Admin فقط:

- Add product.
- Edit price.
- Deactivate product.
- Manage categories.

---

## Future phases خارج MVP

لا ندخلها في البداية:

- Inventory stock.
- Imported product batches.
- Suppliers.
- Cost/profit reports.
- Barcode.
- Receipt printer.
- Offline sync.
- Multiple branches.

---

## Why frontend can change later

لأن:

- الموبايل والويب يستخدمان نفس endpoints.
- DTOs والـ types مشتركة.
- الحساب النهائي في backend.
- الصلاحيات في backend.
- قاعدة البيانات لا تعتمد على شكل الواجهة.
- Web dashboard لاحقًا سيكون مجرد client جديد لنفس API.

---

## أول قرار تنفيذ

نبدأ بإنشاء monorepo:

```text
apps/api
apps/mobile
apps/web لاحقًا
packages/shared
packages/api-client لاحقًا
```

ثم نبني API أولًا، وبعده الموبايل.
