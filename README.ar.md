# RestoCash — الشرح العربي

**RestoCash** هو مشروع نظام نقاط بيع POS للمطاعم والكاشير، مصمم ليبدأ كتطبيق موبايل سريع، لكن بمعمارية تسمح بإضافة لوحة تحكم Web لاحقًا بدون إعادة كتابة النظام.

---

## لماذا هذا المشروع؟

الهدف من RestoCash ليس فقط بناء تطبيق، بل بناء مشروع تعليمي واقعي لتقوية مفاهيم مهمة مثل:

- تصميم REST API
- قواعد البيانات والعلاقات
- JWT Authentication
- Authorization / Roles
- Clean Architecture
- فصل منطق العمل عن الواجهة
- بناء checkout آمن
- تقارير يومية للمبيعات
- مشروع قابل للتوسع مستقبلًا

---

## الفكرة الأساسية

لن يكون المشروع موبايل فقط.

```text
Mobile App الآن ─┐
                 ├── Backend API ── Business Logic ── Database
Web Dashboard لاحقًا ─┘
```

الـ Backend هو مصدر الحقيقة.

الموبايل يعرض ويتفاعل، لكن الحسابات النهائية والصلاحيات وحفظ المبيعات تكون في الـ Backend.

---

## مثال مهم: Checkout

الموبايل يرسل فقط:

```json
{
  "items": [{ "productId": "...", "quantity": 2 }],
  "paymentMethod": "PIX"
}
```

ثم Backend يقوم بـ:

1. جلب السعر الحقيقي من قاعدة البيانات.
2. حساب subtotal لكل item.
3. حساب total النهائي.
4. حفظ البيع.
5. حفظ snapshots للمنتجات.

هذا يمنع التلاعب ويحافظ على دقة التقارير.

---

## التقنيات المستخدمة

### Backend

- NestJS
- TypeScript
- Prisma
- PostgreSQL
- JWT
- bcrypt
- class-validator

### Mobile

- Expo React Native
- TypeScript
- SecureStore للتوكن
- API client منظم

### Web مستقبلًا

- Next.js
- TypeScript
- نفس الـ API

---

## أول نسخة MVP

ستحتوي على:

- Login
- صلاحيات Admin و Cashier
- Categories
- Products
- Cart
- Checkout
- طرق الدفع:
  - Cash
  - Pix
  - Debit Card
  - Credit Card
- Daily Sales Report

---

## القواعد المهمة

### لا نثق بالواجهة في الحساب النهائي

الموبايل يعرض total سريع فقط، لكن Backend يعيد الحساب من قاعدة البيانات.

### حفظ snapshots في SaleItem

نحفظ:

- اسم المنتج وقت البيع
- سعر المنتج وقت البيع
- الكمية
- subtotal

حتى إذا تغير سعر المنتج لاحقًا، البيع القديم يبقى صحيحًا.

### لا نحذف المنتجات التي لها مبيعات

نستخدم:

```text
isActive = false
```

بدل الحذف النهائي.

---

## الحالة الحالية

تم إنشاء:

- Monorepo structure
- Root package scripts
- Shared package
- NestJS API foundation
- Health endpoint
- خطة تطوير مفصلة

تم التحقق من:

```bash
npm run typecheck
npm test
npm --workspace @restocash/api run build
```

والـ API يرجع:

```json
{"status":"ok","service":"restocash-api"}
```

---

## النظرة المستقبلية

لاحقًا يمكن إضافة:

- Web Dashboard
- إدارة المنتجات
- إدارة الكاشيرين
- سجل المبيعات
- تقارير شهرية
- إلغاء بيع مع سبب
- Inventory tracking
- Multi-branch support

---

## ملاحظة تعليمية

هذا المشروع مبني للتعلم العميق. أصعب جزء فيه هو تحديد الحدود:

- الحسابات والصلاحيات والحفظ في Backend.
- الأزرار والعرض وتجربة المستخدم في Mobile.

هذه القاعدة تجعل المشروع نظيفًا وقابلًا للتوسع.
