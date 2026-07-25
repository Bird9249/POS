# Phase 6 — Reporting + Shift Closing

**เป้าหมาย:** รายงานพื้นฐานและปิดกะ

**ก่อนหน้า:** [Phase 5](05-receipt-printing.md) · **ถัดไป:** [Phase 7](07-harden-polish.md)

---

## อ้างอิง
- [03 Basic Reporting](../03-basic-reporting.md) ทั้งหมด
- [04 User & Settings](../04-user-and-settings.md) จำกัดสิทธิ์ Cashier
- [UI Reports](../ui/04-reports.md)

---

## Backend (`webapp`)
- [x] `GET /api/reports/daily-sales?date=` — แยก cash vs transfer
- [x] `GET /api/reports/profit-loss?from&to` — Gross Profit ตามสูตร docs
- [x] `GET /api/reports/top-products?from&to&limit=10` — เรียงตามจำนวนขาย (ล็อกเกณฑ์ในโค้ด)
- [x] Shift model: เปิดกะ / ปิดกะ
- [x] X-Report (อ่านสรุปกะโดยไม่ปิด) / Z-Report (ปิดกะ + บันทึกยอดนับเงินสดจริง/ส่วนต่างถ้ามี)
- [x] Guard: Cashier ไม่เข้าถึง daily/profit/top รวม

## Frontend (`native`)
- [x] หน้า Daily Sales (Admin)
- [x] หน้า Profit & Loss (Admin)
- [x] หน้า Top Selling 5–10 (Admin)
- [x] รายการบิล/รายละเอียดที่ยาว: cursor + **`useInfiniteQuery` + Virtual**
- [x] เปลี่ยนหน้ารายงาน / sheet ปิดกะ: ใช้ **Motion**
- [x] เปิดกะตอนเข้าใช้งานขาย (หรือปุ่มเปิดกะ)
- [x] ดู X-Report / ปิดด้วย Z-Report
- [x] Cashier: เห็นประวัติ/X-Z เฉพาะกะตนเอง — ไม่เห็นเมนูรายงานรวม

---

## Test / Seed

### เขียน
- [x] **Seed sales for reports** — ใน `seed-pos.ts` (หรือ `seed-demo-sales.ts`):
  - บิลเงินสด + บิลโอนใน “วันนี้”
  - หลายสินค้าเพื่อจัดอันดับ top selling
  - cost snapshot ครบเพื่อคำนวณกำไร
  - (ถ้ามี shift) กะเปิดอยู่ 1 กะของ cashier
- [x] **Test daily sales** — ยอดรวม = เงินสด + เงินโอน ตามบิลที่ seed
- [x] **Test profit** — Gross Profit = Σ (sell − cost) × qty ตามสูตร docs
- [x] **Test top products** — ลำดับและจำนวนถูกต้อง; limit 5–10
- [x] **Test reports forbidden for cashier** — daily/profit/top → 403
- [x] **Test X-Report** — อ่านสรุปโดยไม่ปิดกะ
- [x] **Test Z-Report** — ปิดกะแล้วเปิดซ้ำ/ขายต่อตามนโยบาย; ปิดซ้ำไม่ได้

ตำแหน่งไฟล์แนะนำ:
```text
webapp/src/modules/reports/**/*.test.ts
webapp/src/modules/shifts/**/*.test.ts
webapp/src/server/scripts/seed-pos.ts          # demo sales + open shift
native/src/features/reports/**/*.test.ts        # formatters / guards ถ้ามี
```

### รัน
```bash
# จาก webapp/
bun run src/server/scripts/seed-pos.ts
bun test src/modules/reports src/modules/shifts
bun test

# จาก native/ (ถ้ามีเทส)
bun test src/features/reports
```

เกณฑ์ผ่าน: seed สร้างบิลครบชนิดชำระ · ตัวเลขรายงานตรงกับ assertion · cashier ถูก 403

---

## Definition of Done
- [x] Acceptance ใน docs 03 ครบ
- [x] Cashier ถูกบล็อกทั้ง UI และ API จากรายงานรวม/ต้นทุน
- [x] Seed รายงาน/กะรันได้ · เทสรายงาน + shift ผ่าน

## ของส่งมอบ
| รายการ | Offline |
| --- | --- |
| รายงาน + X/Z Report | Online หลัก |
