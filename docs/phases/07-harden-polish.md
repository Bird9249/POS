# Phase 7 — Harden Offline, RBAC, Polish

**เป้าหมาย:** ทนทานในร้านจริง ปิดช่องโหว่สิทธิ์ และเก็บงานค้าง

**ก่อนหน้า:** [Phase 6](06-reporting-shift.md) · **ถัดไป:** —

---

## อ้างอิง
- [05 Architecture](../05-architecture.md) §4.5, §7
- Acceptance รวมจาก [01](../01-checkout-and-sales.md)–[04](../04-user-and-settings.md)
- [UI States](../ui/06-states-feedback.md)

---

## งานหลัก
- [ ] ทดสอบฉากออฟไลน์: ขายหลายบิล → กลับออนไลน์ → sync ครบ ไม่ซ้ำ
- [ ] Stock conflict: หลัง push ให้ pull ทับค่า server
- [ ] Session หมดอายุตอนออฟไลน์: นโยบายชัด (ขายต่อได้ช่วงสั้น / บังคับ login เมื่อออนไลน์)
- [ ] กันขายสต็อก 0 ตามนโยบายที่ล็อกแล้ว
- [ ] Empty / error / retry states ทั้งแอป
- [ ] Touch target + keyboard/scan UX บนเครื่องจริง
- [ ] ตรวจ permission matrix docs 04 ทีละช่อง (UI + API)
- [ ] รวม seed สุดท้ายให้เป็นชุด demo เดียวที่รันคำสั่งเดียวจบ

---

## Test / Seed

### เขียน
- [ ] **Seed สุดท้าย (`seed-pos.ts`)** รวมครบ:
  - admin + cashier
  - categories + products (+ low stock)
  - receipt config
  - demo sales (cash/transfer)
  - shift ตัวอย่าง (ถ้าระบบกะพร้อม)
  - idempotent: รันซ้ำไม่พัง (upsert / skip ถ้ามีแล้ว)
- [ ] **Test permission matrix** — ตาราง docs 04 ทีละช่อง (API)
- [ ] **Test offline sync scenario** — จำลอง outbox หลายบิล → push → ไม่ซ้ำ, สต็อกสุดท้ายตรง
- [ ] **Test stock conflict** — local ต่างจาก server แล้วหลัง pull ใช้ค่า server
- [ ] **Test zero-stock policy** — ตามที่ล็อก (บล็อกหรือเตือน)
- [ ] **Smoke checklist script (optional)** — สคริปต์เรียก health → login → sync → create sale → daily report

ตำแหน่งไฟล์แนะนำ:
```text
webapp/src/server/scripts/seed-pos.ts
webapp/tests/e2e-or-integration/permission-matrix.test.ts
webapp/tests/integration/offline-sync-scenario.test.ts
native/src/lib/sync/**/*.test.ts
```

### รัน
```bash
# จาก webapp/ — ชุดเต็ม
bun run db:push
bun run rbac:sync
bun run src/server/scripts/seed-pos.ts
bun test

# จาก native/
bun test

# ตรวจด้วยมือหลัง seed (แนะนำ)
# 1) login admin / cashier
# 2) sync catalog
# 3) ขายออฟไลน์ 2 บิล แล้วออนไลน์ sync
# 4) เปิดรายงานรายวัน + Z-Report
```

เกณฑ์ผ่าน: `bun test` ทั้ง webapp และ native ผ่านทั้งหมด · seed รันซ้ำได้ · smoke มือตาม checklist ด้านบนผ่าน

---

## Definition of Done
- Checklist acceptance ใน docs 01–04 ผ่านครบ
- Offline checkout ใช้ได้จริงบน Android/device เป้าหมาย
- ไม่มีทาง Cashier ดึงต้นทุนหรือรายงานรวมจาก API
- Seed demo ครบ · เทสรวมทั้งโปรเจกต์ผ่าน

## ของส่งมอบ
| รายการ | Offline |
| --- | --- |
| Harden + ปิด acceptance | ครบตาม scope |
