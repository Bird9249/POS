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
- [ ] Schema store/receipt settings (ชุดเดียวต่อร้าน)
- [ ] API: get/update ชื่อร้าน, ที่อยู่, เบอร์โทร, logo, เลขบัญชี, static QR image/url
- [ ] สิทธิ์: Admin เท่านั้นที่แก้

## Frontend (`native`)
- [ ] หน้า Settings — Receipt Configuration (Admin, online)
- [ ] Pull config ลง `meta` / ตาราง settings local สำหรับใช้ตอนออฟไลน์
- [ ] หน้าโอนเงินใช้ QR จาก config จริง
- [ ] หลังขายสำเร็จ: พรีวิวใบเสร็จ + พิมพ์
- [ ] รองรับความกว้าง **58mm / 80mm**
- [ ] เนื้อหาใบเสร็จครบตาม docs 01 (+ เลขบิล, cashier, ยอด, ทอน)

---

## Test / Seed

### เขียน
- [ ] **Seed receipt config** ใน `seed-pos.ts`:
  - ชื่อร้าน, ที่อยู่, เบอร์โทร, เลขบัญชี
  - placeholder logo/QR URL หรือ path ทดสอบ
  - ความกว้างใบเสร็จเริ่มต้น (58 หรือ 80)
- [ ] **Test settings API** — admin GET/PATCH ได้; cashier PATCH ได้ 403; cashier GET อ่านสำหรับพิมพ์ได้ตามนโยบายที่ล็อก
- [ ] **Test receipt renderer (unit)** — จาก sale + store config → ข้อความ/โครงใบเสร็จมีครบฟิลด์บังคับ
- [ ] **Test width variant** — สลับ 58mm / 80mm แล้ว layout function ไม่พัง (snapshot หรือ assert ความยาวบรรทัด)
- [ ] **Test local cache** — หลัง pull แล้วอ่าน config จาก local ได้โดยไม่ยิง API

ตำแหน่งไฟล์แนะนำ:
```text
webapp/src/modules/settings/**/*.test.ts
webapp/src/server/scripts/seed-pos.ts
native/src/features/receipt/**/*.test.ts
native/src/features/settings/**/*.test.ts
```

### รัน
```bash
# จาก webapp/
bun run src/server/scripts/seed-pos.ts
bun test src/modules/settings

# จาก native/
bun test src/features/receipt src/features/settings
bun test
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
