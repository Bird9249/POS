# Architecture — Mobile First + Selective Offline First

เอกสารนี้กำหนดทิศทางเทคนิคของโปรเจกต์ POS

| ส่วน | บทบาท |
| --- | --- |
| [`native/`](../native/) | **UI (Frontend)** — Tauri 2 + React, mobile-first |
| [`webapp/`](../webapp/) | **API (Backend)** — Bun + Elysia + PostgreSQL, source of truth |

> `webapp` ในระยะ POS ใช้เป็น **API server เป็นหลัก** UI admin ใน webapp (ถ้ามี) เป็นรอง ไม่ใช่หน้าขายหลัก

---

## 1. เป้าหมายออกแบบ

1. **Mobile First** — ออกแบบและพัฒนา UX สำหรับมือถือ/แท็บเล็ตก่อน (Android ผ่าน Tauri) แล้วค่อยขยายจอใหญ่
2. **Offline First เฉพาะที่จำเป็น** — ส่วนขายต้องทำงานได้เมื่อเน็ตหลุด ส่วนรายงาน/ตั้งค่าใช้ online เป็นหลัก
3. **แยก Frontend / Backend ชัด** — `native` ไม่มี business API ของตัวเอง; `webapp` เป็นศูนย์กลางข้อมูลและความจริง (server of truth)

---

## 2. ภาพรวมระบบ

```text
┌─────────────────────────────────────┐
│  native (POS Client)                │
│  React UI · Mobile First            │
│  Local DB (SQLite) · Outbox Queue   │
│  TanStack Query (cache + sync)      │
└──────────────┬──────────────────────┘
               │ HTTPS / REST (เมื่อออนไลน์)
               ▼
┌─────────────────────────────────────┐
│  webapp (API)                       │
│  Elysia /api · Better Auth · RBAC   │
│  PostgreSQL (source of truth)       │
└─────────────────────────────────────┘
```

### หน้าที่แต่ละฝั่ง

| ชั้น | `native` | `webapp` |
| --- | --- | --- |
| UI ขาย / คิดเงิน | ใช่ (หลัก) | ไม่ใช่ |
| Local cache / offline queue | ใช่ | ไม่ใช่ |
| Auth session ใช้งานจริงบนเครื่อง | เก็บ session/token ที่ client | ออก session / ตรวจสิทธิ์ |
| Business rules ขั้นสุดท้าย | validate เบื้องต้น | validate + persist จริง |
| รายงานรวม / กำไร / ตั้งค่าร้าน | อ่านจาก API (หรือ cache อ่านอย่างเดียว) | คำนวณและเก็บข้อมูล |

---

## 3. Mobile First (UI ใน `native`)

### หลักการ
- Layout เริ่มจากจอแคบ (portrait phone/tablet)
- Touch target ใหญ่ พอสำหรับนิ้ว (ขั้นต่ำ ~44px)
- Checkout เป็นหน้าหลัก — สแกน / ค้นหา / ตะกร้า / ชำระ อยู่ใน flow ที่ใช้นิ้วมือได้สะดวก
- ใช้ safe area (มี `native/src/lib/safe-area.ts` อยู่แล้ว) สำหรับ notch / gesture bar
- Desktop/webview กว้างเป็น enhancement ไม่ใช่จุดเริ่มออกแบบ

### โครงสร้าง UI ที่แนะนำ
```text
native/src/
├── routes/                 # หน้า: login, checkout, products, reports, settings
├── features/               # แยกตามโดเมน (checkout, products, sync, auth)
├── components/ui/          # shadcn — ปรับให้ touch-friendly
└── lib/
    ├── api/                # HTTP client → webapp /api
    ├── db/                 # local SQLite access
    └── sync/               # pull / push / conflict
```

### มาตรฐาน list / motion (บังคับในแผน implement)
| งาน | ใช้ |
| --- | --- |
| รายการยาว + infinite scroll | **TanStack Query** (`useInfiniteQuery`) + **TanStack Virtual** + API **cursor pagination** |
| Animation / transition | **Motion** (`motion/react`) — ไม่เขียน CSS animation เป็นหลัก |

ดูรายละเอียดใน [phases/README.md](phases/README.md) และ [ui/README.md](ui/README.md)

### หน้าจอหลัก (Mobile)
| หน้า | ผู้ใช้หลัก | โหมดเครือข่าย |
| --- | --- | --- |
| Checkout | Cashier / Admin | Offline-capable |
| Products | Admin | Online หลัก (อ่าน cache ได้) |
| Reports | Admin | Online หลัก |
| Shift close | Cashier / Admin | Online แนะนำ (อ่านสรุปจาก local ได้ชั่วคราว) |
| Settings | Admin | Online เท่านั้น |

---

## 4. Selective Offline First

ไม่ทำ offline ทั้งระบบ — เลือกเฉพาะงานที่ร้านขาดไม่ได้เมื่อเน็ตหลุด

### 4.1 ต้องทำงาน Offline ได้

| ความสามารถ | เหตุผล | กลยุทธ์ |
| --- | --- | --- |
| ค้นหา / สแกนสินค้า | ขายต่อไม่ได้ถ้าหาสินค้าไม่ได้ | Sync catalog ลง SQLite, อ่านจาก local |
| จัดการตะกร้า + ส่วนลด | เป็นขั้นตอนก่อนชำระ | อยู่บนเครื่องทั้งหมด |
| ชำระเงินสด / โอน (Manual) | หัวใจของ POS | บันทึกขายลง local + outbox |
| ตัดสต็อกบนเครื่อง (optimistic) | กันขายเกินในเครื่องนั้น | ปรับ local qty ทันที แล้ว sync |
| พิมพ์ใบเสร็จ | ลูกค้ารอใบเสร็จ | ใช้ข้อมูล local + config ที่ cache ไว้ |
| ดูสินค้า Low Stock (จาก cache) | เตือนคร่าวๆ | อ่านจาก local snapshot |

### 4.2 Online เป็นหลัก (ไม่บังคับ Offline)

| ความสามารถ | เหตุผล |
| --- | --- |
| รายงาน Daily Sales รวมหลายเครื่อง | ต้องรวมจาก server |
| Profit & Loss / Top Selling ระยะยาว | คำนวณจากข้อมูลจริงบน Postgres |
| จัดการผู้ใช้ / เปลี่ยน Role | ความปลอดภัย |
| แก้ Receipt Configuration | เปลี่ยนครั้งเดียว ส่งขึ้น server |
| อัปโหลดรูปสินค้า | ไฟล์ใหญ่ ใช้ตอนมีเน็ต |
| Z-Report ปิดวันแบบทางการ | ยอดทางการอยู่ที่ server (X-Report จาก local ได้) |

### 4.3 โมเดลข้อมูลบนเครื่อง (Local)

แนะนำ **SQLite** ผ่าน Tauri plugin (ทนทานกว่า IndexedDB สำหรับ POS)

ตารางหลักบนเครื่อง (แนวทาง):
- `products_local` — snapshot สินค้า (ชื่อ, barcode, ราคา, stock แบบประมาณการ)
- `categories_local`
- `sales_outbox` — บิลที่ขายแล้วรอ sync
- `sale_items_outbox`
- `stock_adjustments_outbox` (ถ้า Admin ปรับสต็อกตอนออฟไลน์ — ระยะหลัง)
- `meta` — `last_pulled_at`, store config cache, session cache

### 4.4 Sync Protocol

```text
Online แล้ว:
  1) PUSH outbox (sales, adjustments) → POST /api/...
  2) ถ้าสำเร็จ → mark synced / ลบออกจาก outbox
  3) PULL catalog + stock + receipt config → upsert ลง SQLite
  4) ดึงรายงานจาก API ตามหน้าจอที่เปิด (ไม่เก็บทั้งรายงานลงเครื่องระยะแรก)
```

**ทิศทางความจริง (Source of Truth)**
- Server (`webapp` + PostgreSQL) ชนะเมื่อข้อมูลชนกัน ยกเว้นบิลที่สร้างออฟไลน์ซึ่งมี `client_sale_id` (UUID) เป็น idempotency key
- การขายออฟไลน์ใช้ `client_sale_id` กันซ้ำตอน sync
- Stock conflict: server เป็นจริง → client pull ค่าล่าสุดหลัง push เสร็จ

### 4.5 สถานะเครือข่ายใน UI
- แสดงตัวบ่งชี้ Online / Offline / Syncing
- ถ้ามีรายการใน outbox → แสดงจำนวนบิลรอ sync
- บล็อกเฉพาะงาน online-only พร้อมข้อความชัดเจน ไม่บล็อก Checkout

---

## 5. Backend API (`webapp`)

### บทบาท
- Source of truth ของสินค้า, สต็อก, บิลขาย, ผู้ใช้, ตั้งค่าร้าน
- ตรวจ Auth / RBAC (Admin, Cashier)
- รับ sync จาก `native` แบบ idempotent

### โมดูล API ที่จะเพิ่ม (สอดคล้อง docs ธุรกิจ)

| Module | Endpoint แนวทาง | ใช้กับ Offline |
| --- | --- | --- |
| `products` | CRUD, categories, stock adjust | Pull catalog |
| `sales` | create sale (idempotent), list, shift reports | Push outbox |
| `reports` | daily, profit, top products, X/Z | Online |
| `settings` | receipt/store config | Pull cache |
| `auth` / `users` / `rbac` | มีอยู่แล้ว | Login online ก่อนใช้งาน |

### สัญญา API สำคัญสำหรับ Offline
- `POST /api/sales` รับ `client_sale_id` → ถ้ามีแล้วคืนบิลเดิม (idempotent)
- `GET /api/products/sync?since=ISO` → delta pull
- `GET /api/settings/receipt` → config สำหรับใบเสร็จ/QR

### Auth กับ Tauri
- ใช้ Better Auth ที่มีอยู่ แต่ต้องออกแบบให้ native เรียกข้าม origin ได้ (cookie `SameSite=None; Secure` หรือ pattern token ที่เหมาะกับ WebView)
- Session หมดอายุตอนออฟไลน์: อนุญาตขายต่อด้วย session ที่ cache ไว้ในช่วงสั้นๆ แล้วบังคับ refresh เมื่อกลับออนไลน์ (กำหนดนโยบายชัดใน implementation)

---

## 6. แมปกับโมดูลธุรกิจ

| โมดูลธุรกิจ | UI (`native`) | API (`webapp`) | Offline |
| --- | --- | --- | --- |
| [Checkout & Sales](01-checkout-and-sales.md) | หน้าหลัก | `sales`, products read | ใช่ |
| [Product & Inventory](02-product-and-inventory.md) | หน้าจัดการ (Admin) | `products` | อ่านได้ / เขียน online หลัก |
| [Basic Reporting](03-basic-reporting.md) | หน้ารายงาน | `reports` | ไม่บังคับ |
| [User & Settings](04-user-and-settings.md) | ตั้งค่า / login | `auth`, `users`, `settings` | Login/ตั้งค่า = online |

---

## 7. หลักการที่ไม่ทำ (ระยะนี้)

- ไม่ทำ multi-master sync ซับซ้อน (เช่น CRDT ทั้งระบบ)
- ไม่ cache รายงานใหญ่ทั้งก้อนลงเครื่อง
- ไม่ให้ `native` เขียน Postgres โดยตรง
- ไม่พึ่ง PWA ของ `webapp` เป็นตัวขายหลัก — ตัวขายคือแอป native
- ไม่ต่อ Bank API ในระยะแรก (ตาม overview)

---

## 8. ลำดับงานเทคนิคแนะนำ

1. กำหนด API contract + Auth สำหรับ native
2. ตั้ง local SQLite + product pull ใน `native`
3. สร้าง Checkout อ่านจาก local (mobile-first UI)
4. บันทึกขายลง outbox + push เมื่อออนไลน์
5. พิมพ์ใบเสร็จจากข้อมูล local
6. เพิ่มรายงาน/ตั้งค่าแบบ online
7. ขัดเกลา conflict สต็อก + สถานะ sync ใน UI

---

## 9. คำตัดสินใจสรุป (ADR-style)

| หัวข้อ | คำตัดสิน |
| --- | --- |
| Frontend | `native` (Tauri + React), mobile-first |
| Backend | `webapp` (Bun + Elysia + Postgres) เป็น API / source of truth |
| Offline scope | เฉพาะ Checkout + catalog/stock อ่าน + sales outbox |
| Local store | SQLite บนเครื่อง |
| Sync | Push outbox แล้ว Pull delta; idempotent ด้วย `client_sale_id` |
| Online-only | รายงานรวม, จัดการผู้ใช้, แก้ตั้งค่าร้าน, อัปโหลดรูป |
| Long lists | Cursor page + TanStack Query infinite + TanStack Virtual |
| Animation | Motion (`motion/react`) |
