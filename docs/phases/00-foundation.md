# Phase 0 — Foundation

**เป้าหมาย:** ให้ `native` คุยกับ `webapp` ได้ และมีโครงแอป mobile-first พร้อม Auth / Role

**ก่อนหน้า:** — · **ถัดไป:** [Phase 1](01-products-and-categories.md)

---

## อ้างอิง
- [04 User & Settings](../04-user-and-settings.md) Role Admin / Cashier
- [05 Architecture](../05-architecture.md) §2, §5 Auth

---

## Backend (`webapp`)
- [x] ล็อก Role POS เป็น 2 บทบาท: `admin`, `cashier` (+ sync permissions)
- [x] ตรวจว่า permission แยกงานขาย / สินค้า / รายงาน / ตั้งค่า ตามตารางใน docs 04
- [x] เปิด CORS + Auth ให้ Tauri WebView เรียก `/api` ได้ (cookie หรือ session strategy ที่แนะนำใน architecture)
- [x] `GET /api/health` ใช้เช็ค online จาก native
- [x] เพิ่ม script ใน `package.json`: `test`, `db:seed` (หรือ `seed:pos`)

## Frontend (`native`)
- [x] รัน desktop dev ได้ด้วย `bun run desktop:dev`
- [x] ติดตั้ง **Motion**: `bun add motion` (ใช้ `motion/react` ทั้งแอป)
- [x] โครงโฟลเดอร์: `features/`, `lib/api/`, `lib/db/`, `lib/sync/`
- [x] API client ชี้ไป `webapp` (env: base URL)
- [x] หน้า Login + เก็บ session (transition เข้าแอปด้วย Motion ถ้ามี)
- [x] App shell mobile-first: bottom nav / safe area, หน้าเปล่า Checkout / Products / Reports / Settings
- [x] ตัวบ่งชี้ Online / Offline เบื้องต้น (ping health หรือ `navigator.onLine` + health)
- [x] ซ่อนเมนูตาม Role (Cashier ไม่เห็น Products จัดการ / Reports รวม / Settings)
- [x] เพิ่ม script `test` ใน `package.json` (Bun test)
- [x] (เตรียม) helper/pattern ร่วมสำหรับ infinite list: `useInfiniteQuery` + Virtual — ใช้จริงตั้งแต่ Phase 1

> มาตรฐาน list/motion: [phases/README.md](README.md) §มาตรฐาน Frontend UI

---

## Test / Seed

### เขียน
- [x] **Seed roles + users** — ขยายจาก `webapp/src/server/scripts/seed-admin.ts` หรือสร้าง `seed-pos.ts`:
  - sync RBAC (`admin`, `cashier`)
  - สร้าง user `admin@admin.com` / role admin
  - สร้าง user `cashier@pos.com` / role cashier
- [x] **Test API health** — `GET /api/health` ตอบ 200
- [x] **Test auth** — login admin/cashier สำเร็จ; token/session ใช้เรียก `/api/me` ได้
- [x] **Test RBAC menu contract** (unit หรือ API): cashier ไม่มี permission รายงานรวม / จัดการสินค้า / ตั้งค่าร้าน
- [x] **Test native (unit)** — helper ซ่อนเมนูตาม role (pure function)

ตำแหน่งไฟล์แนะนำ:
```text
webapp/src/server/scripts/seed-pos.ts
webapp/src/modules/auth/**/*.test.ts          # หรือ tests/api/auth.test.ts
webapp/src/modules/roles/**/*.test.ts
native/src/features/auth/**/*.test.ts
```

### รัน
```bash
# จาก webapp/
bun run rbac:sync
bun run src/server/scripts/seed-pos.ts    # หรือ bun run db:seed
bun test                                  # หลังเพิ่ม script "test": "bun test"

# จาก native/
bun test
```

เกณฑ์ผ่าน: seed จบโดยไม่มี error · `bun test` ทั้งสองฝั่ง (ที่มีเทสใน phase นี้) ผ่านทั้งหมด

---

## Definition of Done
- Login ด้วย Admin และ Cashier ได้
- Cashier เห็นเฉพาะเมนูที่อนุญาต
- Native เรียก API ที่ต้อง auth ผ่านแล้ว
- Seed POS users รันได้ซ้ำได้ (idempotent พอสมควร)
- เทสของ phase นี้ผ่าน

## ของส่งมอบ
| รายการ | Offline |
| --- | --- |
| Login, Role, App shell, API client | — |
