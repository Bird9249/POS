# Phase 3 — Checkout MVP (อ่านจาก Local)

**เป้าหมาย:** ขายบนมือถือได้ครบ flow ก่อน persist ขึ้น server (cart ใน memory ได้ — ต่อ Phase 4 ทันทีสำหรับ outbox)

**ก่อนหน้า:** [Phase 2](02-local-db-sync-stock.md) · **ถัดไป:** [Phase 4](04-sales-outbox-sync.md)

---

## อ้างอิง
- [01 Checkout & Sales](../01-checkout-and-sales.md) §1.1–1.3
- [05 Architecture](../05-architecture.md) mobile checkout
- [UI Checkout](../ui/02-checkout.md)

---

## Frontend (`native`)
- [x] หน้า Checkout mobile-first (ค้นหา + ตะกร้า + สรุปยอด)
- [x] Search จาก SQLite: ชื่อ / รหัส / barcode
- [x] ผลค้นหาที่ยาวได้: **TanStack Virtual** (อ่าน local ก็ virtualize)
- [x] รองรับอินพุตสแกนเนอร์ (คีย์บอร์ด wedge) ที่ช่องค้นหา
- [x] Cart: เพิ่ม / ลบ / เปลี่ยนจำนวน
- [x] ส่วนลดรายการ: `%` หรือจำนวนเงิน (กีบ)
- [x] ส่วนลดทั้งบิล (ถ้ารองรับในรอบนี้)
- [x] คำนวณยอดตามสูตรใน docs 01
- [x] ชำระ **เงินสด**: กรอกเงินรับ → คำนวณทอน → กันยอดไม่พอ
- [x] ชำระ **โอน**: แสดง Static QR จาก config ที่ cache (ถ้ายังไม่มี config ใช้ placeholder + ดึงใน Phase 5)
- [x] ยืนยันโอนแบบ Manual (`confirmed_by_staff`)
- [x] Sheet ชำระ / ส่วนลด / สำเร็จ: เปิด-ปิดด้วย **Motion**

## Backend (`webapp`)
- [x] (เตรียม) draft contract `POST /api/sales` + `client_sale_id` — implement เต็มใน Phase 4

---

## Test / Seed

### เขียน
- [x] **Seed** — ใช้ catalog จาก Phase 1–2; เพิ่มสินค้าที่รู้ barcode ชัดเจนสำหรับเทสสแกน (เช่น `BARCODE-001`)
- [x] **Test cart math (unit)** — ยอดรายการ / ส่วนลด `%` / ส่วนลดเงิน / ส่วนลดบิล / ยอดไม่ติดลบ
- [x] **Test cash change (unit)** — ทอนถูกต้อง; เงินรับ < ยอด → invalid
- [x] **Test local search (unit)** — ค้นชื่อ/barcode จาก fixture SQLite หรือ in-memory list
- [x] **Test transfer confirmation (unit)** — ต้องมี `confirmed_by_staff` ก่อนถือว่าชำระโอนสำเร็จ
- [x] **(Optional) contract test** — schema ของ draft `POST /api/sales` validate ได้

ตำแหน่งไฟล์แนะนำ:
```text
native/src/features/checkout/**/*.test.ts     # cart, payment, totals
webapp/src/modules/sales/**/schema*.test.ts   # ถ้ามี draft contract
```

### รัน
```bash
# จาก webapp/ — เตรียมข้อมูลค้นหาบนเครื่องผ่าน sync
bun run src/server/scripts/seed-pos.ts

# จาก native/
bun test src/features/checkout
# หรือ
bun test
```

เกณฑ์ผ่าน: unit ตะกร้า/ทอน/ค้นหาผ่าน · seed มี barcode คงที่สำหรับยิงเทสมือ

---

## Definition of Done
- ค้นหา/สแกน/ตะกร้า/ส่วนลด/เงินสด-โอน ใช้ได้บนเครื่องโดยไม่ง้อเครือข่ายสำหรับอ่านสินค้า
- Acceptance ฝั่ง UI ของ docs 01 ข้อค้นหา–ชำระ ผ่าน (ยังไม่นับพิมพ์ใบเสร็จ)
- เทสคำนวณตะกร้า/ทอนผ่าน · seed พร้อมใช้

## ของส่งมอบ
| รายการ | Offline |
| --- | --- |
| Checkout UI (ค้นหา, ตะกร้า, ชำระ) | อ่าน local |
