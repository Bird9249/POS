# Phase 2 — Local DB, Catalog Sync, Stock

**เป้าหมาย:** native เก็บ catalog ใน SQLite และดึง/อัปเดตสต็อกได้

**ก่อนหน้า:** [Phase 1](01-products-and-categories.md) · **ถัดไป:** [Phase 3](03-checkout-mvp.md)

---

## อ้างอิง
- [02 Product & Inventory](../02-product-and-inventory.md) §2.2–2.3
- [05 Architecture](../05-architecture.md) §4.3–4.4

---

## Backend (`webapp`)
- [ ] `GET /api/products/sync?since=` — delta pull (รวม stock, updated_at)
- [ ] Stock adjustment API: restock / increase / decrease + reason + audit fields
- [ ] กฎ: ปรับลบแล้ว stock ไม่ติดลบ (ตามนโยบาย docs)
- [ ] ประวัติ stock adjustment เก็บบน server

## Frontend (`native`)
- [ ] ติดตั้ง SQLite (Tauri plugin) + schema local:
  - `products_local`, `categories_local`, `meta`
- [ ] Sync engine ขั้นแรก: **Pull only** catalog/stock ลงเครื่อง
- [ ] หน้า Stock Adjustment (Admin, online)
- [ ] Low Stock badge/list จากข้อมูล local หรือ API
- [ ] ปุ่ม Sync แมนนวล + sync ตอนเปิดแอปเมื่อออนไลน์

---

## Test / Seed

### เขียน
- [ ] **Seed** — ยืนยันใน seed ว่ามีสินค้า low-stock และสินค้าสต็อกปกติ (จาก Phase 1)
- [ ] **Seed stock movements (optional)** — adjustment ตัวอย่าง 1–2 รายการสำหรับทดสอบประวัติ
- [ ] **Test sync API** — หลัง seed, `GET /api/products/sync` ได้ครบ; เรียกใหม่ด้วย `since=` ได้เฉพาะที่เปลี่ยน
- [ ] **Test stock adjust** — restock / increase / decrease ถูกต้อง; decrease เกินสต็อกแล้วถูกปฏิเสธ
- [ ] **Test low stock rule** — unit: `stock_qty < min_stock` → flagged
- [ ] **Test native local DB (unit/integration)** — upsert จาก sync payload แล้ว query ตาม barcode ได้
- [ ] **Test pull idempotent** — sync สองครั้งแล้วแถวใน SQLite ไม่ซ้ำ

ตำแหน่งไฟล์แนะนำ:
```text
webapp/src/modules/products/**/sync*.test.ts
webapp/src/modules/products/**/stock*.test.ts
native/src/lib/db/**/*.test.ts
native/src/lib/sync/**/*.test.ts
```

### รัน
```bash
# จาก webapp/
bun run src/server/scripts/seed-pos.ts
bun test                          # รวม sync + stock tests

# จาก native/
bun test src/lib/db src/lib/sync
# หรือ
bun test
```

เกณฑ์ผ่าน: seed พร้อม low-stock · เทส sync/adjust ผ่าน · เทส local upsert ผ่าน

---

## Definition of Done
- เครื่องมีสำเนาสินค้าใน SQLite หลัง sync
- ปรับสต็อกบน server แล้ว pull แล้วค่าบนเครื่องตรง
- Low stock แสดงเมื่อ `stock_qty < min_stock`
- เทส + seed ของ phase นี้รันผ่าน

## ของส่งมอบ
| รายการ | Offline |
| --- | --- |
| SQLite + pull sync + stock adjust + low stock | อ่าน catalog ได้ |
