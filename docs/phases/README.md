# Implementation Phases

แผนลงมือทำทีละ phase อิงจากเอกสารใน [`docs/`](../)

Frontend = [`native/`](../../native/) · Backend = [`webapp/`](../../webapp/)

## ลำดับ Phase

```text
Phase 0  Foundation (Auth, shell, API client)
    ↓
Phase 1  Products & Categories (API + Admin UI)
    ↓
Phase 2  Local DB + Catalog Sync + Stock
    ↓
Phase 3  Checkout MVP (ค้นหา, ตะกร้า, ชำระ) — อ่านจาก local
    ↓
Phase 4  Sales Persist + Offline Outbox Sync
    ↓
Phase 5  Receipt Config + Printing
    ↓
Phase 6  Reporting + Shift Close
    ↓
Phase 7  Harden Offline, RBAC, Polish
```

## ไฟล์ราย Phase

| Phase | ไฟล์ | ของส่งมอบหลัก |
| --- | --- | --- |
| 0 | [00-foundation.md](00-foundation.md) | Login, Role, App shell, API client |
| 1 | [01-products-and-categories.md](01-products-and-categories.md) | Products / Categories API + Admin UI |
| 2 | [02-local-db-sync-stock.md](02-local-db-sync-stock.md) | SQLite + pull sync + stock + low stock |
| 3 | [03-checkout-mvp.md](03-checkout-mvp.md) | Checkout UI (ค้นหา, ตะกร้า, ชำระ) |
| 4 | [04-sales-outbox-sync.md](04-sales-outbox-sync.md) | บันทึกขาย + outbox push/pull |
| 5 | [05-receipt-printing.md](05-receipt-printing.md) | ตั้งค่าใบเสร็จ + พิมพ์ |
| 6 | [06-reporting-shift.md](06-reporting-shift.md) | รายงาน + X/Z Report |
| 7 | [07-harden-polish.md](07-harden-polish.md) | Harden + ปิด acceptance |

## กฎของแผน
- แต่ละ phase ต้องมีของส่งมอบที่ใช้ได้ (ไม่ค้างโครงสร้างเปล่า)
- **ทุก phase ต้องมีขั้นตอน Test / Seed (เขียน + รัน) และผ่านก่อนปิด phase**
- Offline ทำเฉพาะที่จำเป็น ตาม [05](../05-architecture.md) — เริ่มหนักจริงที่ Phase 2–4
- Server เป็น source of truth เสมอ
- ทำทีละ phase ตามลำดับ — อย่าข้าม Phase 2 ก่อน 3 ถ้ายังไม่มี local catalog
- จบ phase เมื่อ Definition of Done ผ่าน ไม่ใช่แค่ขึ้น UI
- อัปเดต checkbox ในไฟล์ phase ตอนทำเสร็จ
- รายการยาว / animation ทำตามมาตรฐาน Frontend ด้านล่าง

## มาตรฐาน Frontend UI (ใช้ร่วมทุก phase)

### Infinite scroll + cursor pagination
รายการที่คาดว่ายาว (สินค้า, ประวัติขาย, รายงานรายการ, low stock ฯลฯ) **ต้อง** ใช้คู่กัน:

| ชั้น | ไลบรารี | หน้าที่ |
| --- | --- | --- |
| ดึงข้อมูลหน้าถัดไป | **TanStack Query** (`useInfiniteQuery`) | cursor / `nextCursor` จาก API |
| เรนเดอร์เฉพาะที่มองเห็น | **TanStack Virtual** (`@tanstack/react-virtual`) | virtualize แถวใน list |

กฎเพิ่มเติม:
- API list ของรายการยาวใช้ **cursor-based pagination** (ไม่ใช้ `offset` เป็นหลักสำหรับ list ยาว)
- Response แนวทาง: `{ items, nextCursor }` — `nextCursor = null` เมื่อหมดหน้า
- อย่า render DOM ทั้งก้อนของรายการยาวแม้ข้อมูลมาจาก local SQLite
- ใช้ pattern ร่วมกันใน `native` (และ admin ใน webapp ถ้ามี list ยาว) — อย่าเขียน infinite scroll คนละสไตล์ทุกหน้า

### Animation / Transition
- ใช้ไลบรารี **[Motion](https://motion.dev/)** (`motion` / `motion/react`) สำหรับ animation และ transition
- **ห้าม** เขียน CSS transition/animation เองเป็นหลัก (ยกเว้น utility เล็กน้อยของ Tailwind ที่ไม่ใช่ motion ของหน้า เช่น `animate-spin` บน spinner)
- ใช้ motion กับ: เปลี่ยนหน้า, เปิด/ปิด sheet/modal, รายการเข้า-ออก, success/feedback สั้นๆ
- คุมให้น้อยและมีจุดประสงค์ — ไม่ทำ motion รกตอนขาย

ติดตั้งใน `native` (Phase 0):
```bash
cd native
bun add motion
```

(`@tanstack/react-query` และ `@tanstack/react-virtual` มีใน native แล้ว)

## มาตรฐาน Test / Seed (ใช้ร่วมทุก phase)

### Seed
- สคริปต์หลัก: `webapp/src/server/scripts/seed-pos.ts` (ขยายจาก `seed-admin.ts`)
- รัน:
```bash
cd webapp
bun run rbac:sync
bun run src/server/scripts/seed-pos.ts
# แนะนำเพิ่มใน package.json: "db:seed": "bun run src/server/scripts/seed-pos.ts"
```
- Seed ควร **idempotent พอใช้ได้** (รันซ้ำไม่พัง)
- แต่ละ phase เติมข้อมูลใน seed ตามที่ไฟล์ phase กำหนด — ไม่แยกสคริปต์กระจัดกระจายโดยไม่จำเป็น

### Test
- ใช้ **Bun test** ทั้ง `webapp` และ `native`
- แนะนำใน `package.json` ทั้งสองโปรเจกต์:
```json
"test": "bun test"
```
- วางไฟล์ใกล้โค้ด: `**/*.test.ts` หรือโฟลเดอร์ `tests/`
- ลำดับตอนปิด phase:
```bash
# webapp
bun run src/server/scripts/seed-pos.ts
bun test

# native
bun test
```
- ห้ามปิด phase ถ้าเทสของ phase นั้นยังไม่ผ่าน

## เอกสารอ้างอิง

| เอกสาร | เนื้อหา |
| --- | --- |
| [01](../01-checkout-and-sales.md) | Checkout & Sales |
| [02](../02-product-and-inventory.md) | Product & Inventory |
| [03](../03-basic-reporting.md) | Basic Reporting |
| [04](../04-user-and-settings.md) | User & Settings |
| [05](../05-architecture.md) | Architecture / Offline |
| [UI](../ui/) | UI Design (Mobile First) |

## นอกขอบเขต (ทำทีหลัง)
- ต่อ Bank / BCEL API ตรวจสลิปอัตโนมัติ
- Multi-branch / multi-store
- Role เพิ่มนอก Admin/Cashier
- Offline stock adjustment ทั้งก้อน
- PWA webapp เป็นตัวขายหลัก
