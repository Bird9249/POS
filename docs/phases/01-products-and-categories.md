# Phase 1 — Products & Categories (Online)

**เป้าหมาย:** มีสินค้าและหมวดหมู่บน server จัดการได้จาก native (Admin)

**ก่อนหน้า:** [Phase 0](00-foundation.md) · **ถัดไป:** [Phase 2](02-local-db-sync-stock.md)

---

## อ้างอิง
- [02 Product & Inventory](../02-product-and-inventory.md) §2.1
- [04 User & Settings](../04-user-and-settings.md) ซ่อนต้นทุนจาก Cashier

---

## Backend (`webapp`)
- [ ] Schema: `products`, `categories` (soft delete สินค้า)
- [ ] ฟิลด์: name, image, barcode, cost_price, sell_price, category_id, stock_qty, min_stock
- [ ] API:
  - Categories CRUD
  - Products CRUD
  - List/search (name, barcode, sku) แบบ **cursor pagination**: `{ items, nextCursor }`
- [ ] `barcode` unique (เมื่อมีค่า)
- [ ] Response สำหรับ Cashier **ไม่มี** `cost_price` (บังคับที่ API)

## Frontend (`native`)
- [ ] หน้า Categories (Admin)
- [ ] หน้า Products list / create / edit (Admin)
- [ ] Products list ยาว: **`useInfiniteQuery` + TanStack Virtual** (ไม่ render ทั้งก้อน)
- [ ] เปิด/ปิดฟอร์มหรือ sheet ด้วย **Motion** (ไม่เขียน CSS transition เอง)
- [ ] อัปโหลดรูป (online) ผ่าน upload API ที่มีอยู่ถ้าใช้ได้
- [ ] แสดง/ซ่อนราคาทุนตาม Role

---

## Test / Seed

### เขียน
- [ ] **Seed catalog** ใน `seed-pos.ts` (หรือ `seed-catalog.ts` ที่ถูกเรียกจาก seed หลัก):
  - หมวดหมู่ตัวอย่าง ≥ 2
  - สินค้าตัวอย่าง ≥ 5 (มี barcode, cost_price, sell_price, stock_qty, min_stock)
  - อย่างน้อย 1 ชิ้นที่ `stock_qty < min_stock` (เตรียม Phase 2)
- [ ] **Test categories API** — create/list/update/delete (admin)
- [ ] **Test products API** — CRUD + soft delete; barcode ซ้ำแล้วได้ error
- [ ] **Test cursor page** — หน้าแรกมี `nextCursor`; หน้าถัดไปไม่ซ้ำ id; หน้าสุดท้าย `nextCursor = null`
- [ ] **Test search** — ค้นด้วยชื่อ / barcode เจอรายการที่ seed
- [ ] **Test cost_price hidden** — login เป็น cashier แล้ว GET product **ไม่มี** field `cost_price`
- [ ] **Test permission** — cashier เรียก POST/PATCH product ได้ 403

ตำแหน่งไฟล์แนะนำ:
```text
webapp/src/server/scripts/seed-pos.ts          # เพิ่ม catalog
webapp/src/modules/products/**/*.test.ts
webapp/src/modules/categories/**/*.test.ts
```

### รัน
```bash
# จาก webapp/
bun run db:push                 # หรือ migrate ตามที่ใช้
bun run src/server/scripts/seed-pos.ts
bun test src/modules/products src/modules/categories
# หรือ
bun test
```

เกณฑ์ผ่าน: seed แล้วมีหมวด+สินค้าใน DB · เทส products/categories ผ่าน · cashier ไม่เห็นทุนใน response

---

## Definition of Done
- Admin เพิ่ม/แก้/ลบ (soft) สินค้าและหมวดหมู่ได้
- Cashier เรียก API แล้วไม่ได้เห็นต้นทุน
- มีสินค้าตัวอย่างพร้อมขายใน phase ถัดไป
- Seed catalog รันได้ · เทสของ phase นี้ผ่าน

## ของส่งมอบ
| รายการ | Offline |
| --- | --- |
| Products / Categories API + Admin UI | Online |
