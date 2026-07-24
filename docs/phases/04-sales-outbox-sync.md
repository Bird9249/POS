# Phase 4 — Sales Persist + Offline Outbox

**เป้าหมาย:** บันทึกการขายจริง ตัดสต็อก และ sync เมื่อกลับออนไลน์

**ก่อนหน้า:** [Phase 3](03-checkout-mvp.md) · **ถัดไป:** [Phase 5](05-receipt-printing.md)

---

## อ้างอิง
- [01 Checkout & Sales](../01-checkout-and-sales.md) flow ข้อ 5–6
- [02 Product & Inventory](../02-product-and-inventory.md) ตัดสต็อกอัตโนมัติ
- [05 Architecture](../05-architecture.md) §4.1, §4.4

---

## Backend (`webapp`)
- [ ] Schema: `sales`, `sale_items` (เก็บ cost snapshot ตอนขายสำหรับรายงานกำไร)
- [ ] `POST /api/sales` idempotent ด้วย `client_sale_id`
- [ ] ใน transaction: บันทึกบิล + ตัดสต็อก server
- [ ] `GET /api/sales` — Admin ดูรวม / Cashier ดูเฉพาะของตนหรือกะตน
- [ ] ปฏิเสธสิทธิ์ Cashier จากรายงานรวม (เตรียม Phase 6)

## Frontend (`native`)
- [ ] ตาราง `sales_outbox`, `sale_items_outbox`
- [ ] เมื่อยืนยันชำระ:
  1. สร้าง `client_sale_id` (UUID)
  2. ตัดสต็อก local (optimistic)
  3. เขียน outbox
  4. ถ้าออนไลน์ → push ทันที
- [ ] Sync worker: **Push outbox → แล้วค่อย Pull catalog**
- [ ] UI: จำนวนบิลรอ sync + สถานะ Syncing / Failed (retry)
- [ ] หน้าประวัติขายกะตนเอง (อ่านจาก local + server เมื่อออนไลน์)
- [ ] ประวัติขายเป็น list ยาว: cursor + **`useInfiniteQuery` + Virtual**; แถวเข้า/ออกใช้ **Motion**

---

## Test / Seed

### เขียน
- [ ] **Seed** — catalog + users; optional: บิลขายตัวอย่าง 1–2 ใบสำหรับประวัติ (ออนไลน์)
- [ ] **Test create sale** — POST แล้วได้บิล + สต็อกบน server ลดตามจำนวน
- [ ] **Test idempotent** — POST ซ้ำด้วย `client_sale_id` เดิม → ได้บิลเดิม, สต็อกไม่ถูกตัดซ้ำ
- [ ] **Test cashier list scope** — cashier เห็นเฉพาะบิลของตน (หรือกะตน)
- [ ] **Test outbox mapper (native unit)** — จาก cart + payment → payload outbox ครบฟิลด์
- [ ] **Test push flow (native)** — mock API: outbox pending → synced; ล้มแล้วคง pending + retry ได้
- [ ] **Test optimistic stock** — หลังขาย local stock ลด; หลัง pull ค่าสอดคล้อง server

ตำแหน่งไฟล์แนะนำ:
```text
webapp/src/modules/sales/**/*.test.ts
native/src/lib/sync/**/*.test.ts
native/src/features/checkout/**/outbox*.test.ts
webapp/src/server/scripts/seed-pos.ts          # เพิ่ม sample sales ถ้าต้องการ
```

### รัน
```bash
# จาก webapp/
bun run src/server/scripts/seed-pos.ts
bun test src/modules/sales

# จาก native/
bun test src/lib/sync src/features/checkout
# หรือรวม
bun test
```

เกณฑ์ผ่าน: idempotent ผ่าน · ตัดสต็อกครั้งเดียว · outbox unit ผ่าน · seed รันได้

---

## Definition of Done
- ขายออฟไลน์ได้ แล้ว sync ขึ้น server ไม่ซ้ำบิล
- สต็อกบน server ถูกตัดหลัง sync
- ขายออนไลน์แล้วบิลขึ้นทันที
- เทสขาย/outbox/idempotent ผ่าน · seed พร้อม

## ของส่งมอบ
| รายการ | Offline |
| --- | --- |
| บันทึกขาย + outbox push/pull | ขายออฟไลน์ได้ |
