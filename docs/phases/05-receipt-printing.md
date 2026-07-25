# Phase 5 — Receipt Configuration + Printing

**เป้าหมาย:** ตั้งค่าข้อมูลร้าน และพิมพ์ใบเสร็จ thermal

**ก่อนหน้า:** [Phase 4](04-sales-outbox-sync.md) · **ถัดไป:** [Phase 6](06-reporting-shift.md)

---

## อ้างอิง
- [01 Checkout & Sales](../01-checkout-and-sales.md) §1.4
- [04 User & Settings](../04-user-and-settings.md) §4.2
- [UI Settings](../ui/05-settings.md)

---

## Backend (`webapp`)
- [x] Schema store/receipt settings (ชุดเดียวต่อร้าน)
- [x] API: get/update ชื่อร้าน, ที่อยู่, เบอร์โทร, logo, เลขบัญชี, static QR image/url
- [x] สิทธิ์: Admin เท่านั้นที่แก้ (GET: admin หรือ cashier ที่มี `sales:create`)

## Frontend (`native`)
- [x] หน้า Settings — Receipt Configuration (Admin, online)
- [x] Pull config ลง `meta` / ตาราง settings local สำหรับใช้ตอนออฟไลน์
- [x] หน้าโอนเงินใช้ QR จาก config จริง
- [x] หลังขายสำเร็จ: พรีวิวใบเสร็จ + พิมพ์
- [x] รองรับความกว้าง **58mm / 80mm**
- [x] เนื้อหาใบเสร็จครบตาม docs 01 (+ เลขบิล, cashier, ยอด, ทอน)

---

## Test / Seed

### เขียน
- [x] **Seed receipt config** ใน `seed-pos.ts`
- [x] **Test settings API** — admin GET/PATCH ได้; cashier PATCH ได้ 403; cashier GET อ่านได้
- [x] **Test receipt renderer (unit)** — จาก sale + store config → ข้อความมีครบฟิลด์บังคับ
- [x] **Test width variant** — สลับ 58mm / 80mm แล้ว layout ไม่พัง
- [x] **Test local cache** — หลัง pull แล้วอ่าน config จาก local ได้โดยไม่ยิง API

ตำแหน่งไฟล์แนะนำ:
```text
webapp/src/modules/settings/**/*.test.ts
webapp/src/server/scripts/seed-pos.ts
native/src/features/receipt/**/*.test.ts
native/src/lib/db/settings-repo.test.ts
```

### รัน
```bash
# จาก webapp/
bun run src/server/scripts/seed-pos.ts
bun test src/modules/settings

# จาก native/
bun test src/features/receipt src/lib/db/settings-repo.test.ts
```

เกณฑ์ผ่าน: seed มีข้อมูลร้าน · เทส API สิทธิ์ผ่าน · เทส renderer ใบเสร็จผ่าน

---

## Definition of Done
- ตั้งค่าแล้วไปโผล่บนใบเสร็จและหน้าโอน
- พิมพ์/พรีวิวใบเสร็จหลังขายได้แม้เน็ตหลุด (ใช้ config ที่ cache)
- Seed receipt รันได้ · เทสของ phase นี้ผ่าน

## ของส่งมอบ
| รายการ | Offline |
| --- | --- |
| ตั้งค่าใบเสร็จ + พิมพ์ | พิมพ์จาก cache |
