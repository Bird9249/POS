# POS System — Project Overview

ระบบ Point of Sale (POS) สำหรับร้านค้าในลาว รองรับการคิดเงิน จัดการสต็อก รายงาน และการจัดการผู้ใช้

---

## เอกสารรายละเอียด

| ข้อ | เอกสาร |
| --- | --- |
| 1. Checkout & Sales | [docs/01-checkout-and-sales.md](docs/01-checkout-and-sales.md) |
| 2. Product & Inventory | [docs/02-product-and-inventory.md](docs/02-product-and-inventory.md) |
| 3. Basic Reporting | [docs/03-basic-reporting.md](docs/03-basic-reporting.md) |
| 4. User & Settings | [docs/04-user-and-settings.md](docs/04-user-and-settings.md) |
| 5. Architecture | [docs/05-architecture.md](docs/05-architecture.md) |
| 6. Implementation Plan | [docs/phases/](docs/phases/) ([index](docs/06-implementation-plan.md)) |
| 7. UI Design | [docs/ui/](docs/ui/) |

---

## สถาปัตยกรรม (สรุป)

- **UI:** [`native/`](native/) — Tauri + React, **mobile first**
- **API:** [`webapp/`](webapp/) — Bun + Elysia + PostgreSQL, **source of truth**
- **Offline first เฉพาะที่จำเป็น:** Checkout, อ่านสินค้า/สต็อกจาก local, คิวบิลรอ sync
- **Online เป็นหลัก:** รายงานรวม, จัดการผู้ใช้, ตั้งค่าร้าน
- **List ยาว:** cursor pagination + TanStack Query (`useInfiniteQuery`) + TanStack Virtual
- **Animation:** Motion (`motion/react`) — ไม่เขียน CSS motion เป็นหลัก

รายละเอียดเต็ม: [docs/05-architecture.md](docs/05-architecture.md)

รายละเอียด UI: [docs/ui/](docs/ui/)

---

## 1. ระบบคิดเงินและออกใบเสร็จ (Checkout & Sales)

### Search & Scan
- ค้นหาสินค้าด้วยการยิง Barcode
- หรือพิมพ์ชื่อ / รหัสสินค้า

### Cart Management
- เพิ่ม / ลบ / เปลี่ยนจำนวนสินค้าในตะกร้า
- ใส่ส่วนลดแบบ `%` หรือจำนวนเงิน (กีบ)

### Payment Methods (Manual)

| วิธีชำระ | รายละเอียด |
| --- | --- |
| **เงินสด (Cash)** | คำนวณเงินทอนอัตโนมัติ |
| **โอนเงิน (Bank Transfer / BCEL One)** | แสดง Static QR Code (QR บัญชีร้าน) บนหน้าจอให้ลูกค้าสแกน แล้วให้พนักงานตรวจ Slip เอง |

> **หมายเหตุ:** ยังไม่ต้องต่อ API ธนาคาร — การยืนยันการโอนเป็นแบบ Manual

### Receipt Printing
- ออกใบเสร็จรับเงิน Thermal Receipt ขนาด **80mm / 58mm**
- ข้อมูลในใบเสร็จ:
  - ชื่อร้าน
  - เบอร์โทร
  - วันที่ / เวลา
  - บัญชีรายชื่อสินค้าและราคา
  - วิธีชำระ
  - ข้อความขอบคุณ

---

## 2. ระบบจัดการสินค้าและสต็อก (Product & Inventory)

### Product Catalog
- เพิ่ม / แก้ไข / ลบ สินค้า
- ข้อมูลสินค้า: ชื่อ, รูป, Barcode, ราคาทุน, ราคาขาย
- จัดกลุ่ม / หมวดหมู่สินค้า (Category)

### Stock Tracking
- ตัดสต็อกอัตโนมัติทันทีเมื่อมีการขาย
- **Stock Adjustment:**
  - เพิ่มสินค้าเข้าคลัง (Restock)
  - ปรับบวก / ลบ เมื่อสินค้าเสียหาย หรือหมดอายุ

### Low Stock Alert
- แสดงไฟ / สัญลักษณ์เตือนเมื่อสินค้าเหลือน้อยกว่า **Min Stock Threshold** ที่ตั้งไว้

---

## 3. ระบบรายงานพื้นฐาน (Basic Reporting)

### Daily Sales Summary
- รายงานยอดขายประจำวัน
- แยกตาม **เงินสด** vs **เงินโอน**

### Profit & Loss Report
- คำนวณกำไรขั้นต้น (Gross Profit) อย่างง่าย:

```text
Gross Profit = (ราคาขาย - ราคาทุน) × จำนวนที่ขาย
```

### Top Selling Products
- รายงาน 5–10 อันดับสินค้าขายดี
- ใช้ช่วยตัดสินใจสั่งของเพิ่ม

### Shift / End of Day Closing
- ระบบปิดกะ / ปิดกา (**X-Report / Z-Report**)
- ใช้ตรวจเช็คยอดเงินสดในลิ้นชัก

---

## 4. ระบบจัดการผู้ใช้และการตั้งค่า (User & System Settings)

### Role-based Access Control (2 Roles)

| Role | สิทธิ์ |
| --- | --- |
| **Admin** (เจ้าของร้าน) | ทำได้ทุกอย่าง — ดูรายงาน, ดูต้นทุน, เพิ่ม/แก้ไขสินค้า |
| **Cashier** (พนักงานขาย) | คิดเงิน, ออกใบเสร็จ, ดูประวัติการขายของกะตนเอง — **ไม่ให้เห็นต้นทุนและรายงานยอดขายรวม** |

### Receipt Configuration
ตั้งค่าข้อมูลที่จะแสดงในใบเสร็จ:
- ชื่อร้าน
- ที่อยู่
- เบอร์โทร
- Logo
- เลขบัญชีธนาคาร

---

## Module Summary

| # | Module | จุดประสงค์หลัก |
| --- | --- | --- |
| 1 | Checkout & Sales | คิดเงิน, ชำระเงิน, ออกใบเสร็จ |
| 2 | Product & Inventory | จัดการสินค้าและสต็อก |
| 3 | Basic Reporting | ยอดขาย, กำไร, สินค้าขายดี, ปิดกะ |
| 4 | User & Settings | Role (Admin/Cashier) และการตั้งค่าใบเสร็จ |

---

## Out of Scope (ช่วงปัจจุบัน)

- ไม่ต่อ Bank API / Payment Gateway อัตโนมัติ (ตรวจ Slip แบบ Manual)
- ไม่มี Role นอกเหนือจาก Admin และ Cashier
