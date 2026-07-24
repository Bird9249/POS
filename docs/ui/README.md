# UI Design — POS Native (Mobile First)

เอกสารออกแบบ UI สำหรับแอปขายใน [`native/`](../../native/)  
อิง [Architecture](../05-architecture.md) และโมดูลธุรกิจ docs 01–04

| ไฟล์ | เนื้อหา |
| --- | --- |
| [README.md](README.md) | หลักการ, IA, Design system, สิทธิ์ UI |
| [01-login.md](01-login.md) | หน้า Login |
| [02-checkout.md](02-checkout.md) | หน้า Checkout (หัวใจแอป) |
| [03-products.md](03-products.md) | สินค้า / หมวดหมู่ / สต็อก |
| [04-reports.md](04-reports.md) | รายงาน + ปิดกะ |
| [05-settings.md](05-settings.md) | ตั้งค่าร้าน / ใบเสร็จ |
| [06-states-feedback.md](06-states-feedback.md) | Offline, Sync, Empty, Error |

---

## 1. เป้าหมาย UX

1. **ขายให้จบเร็ว** — Checkout เป็นหน้าหลัก ใช้นิ้วมือครบ flow ในไม่กี่แตะ
2. **Mobile First** — ออกแบบจอแคบก่อน (phone/tablet portrait)
3. **อ่านง่ายในร้าน** — ตัวเลขราคา/ทอนชัด ปุ่มใหญ่ พอใช้ตอนรีบ
4. **รู้สถานะเครือข่าย** — Online / Offline / Syncing ไม่กวนการขาย
5. **สิทธิ์ชัดใน UI** — Cashier ไม่เห็นเมนูและข้อมูลที่ห้าม

---

## 2. Design Principles

| หลัก | รายละเอียด |
| --- | --- |
| One job per screen | แต่ละหน้ามีงานหลักเดียว (ขาย / จัดการสินค้า / ดูรายงาน / ตั้งค่า) |
| Thumb zone | ปุ่มหลักอยู่ครึ่งล่างจอ (ชำระ, ยืนยัน, บันทึก) |
| Big numbers | ยอดสุทธิ / เงินทอน ใช้ตัวอักษรใหญ่กว่าข้อความทั่วไป |
| Progressive disclosure | ส่วนลด, ปรับจำนวน, QR โอน เปิดเมื่อต้องใช้ ไม่กองในหน้าแรกทั้งหมด |
| Offline never blocks sale | ตอน offline ปิดเฉพาะงาน online-only — Checkout ยังใช้ได้ |
| System UI | **UI ทุกจุดใช้ component จาก shadcn/ui** ใน `native/src/components/ui/` (Button, Input, Card, Badge, Alert, Sheet, …) — ห้ามใช้ `<button>`/`<input>`/`<label>` ดิบหรือ pill แบบ custom แทน; Tailwind เฉพาะจัด layout/spacing |
| Forms | **React Hook Form + Zod** + `zodResolver` — ฟิลด์ใช้ `<Controller />` กับ `<Field />`, `<FieldLabel />`, `<FieldError />` ตาม [shadcn RHF guide](https://ui.shadcn.com/docs/forms/react-hook-form); schema แยกไฟล์ (เช่น `features/**/\*-schema.ts`); ข้อความ validate เป็นภาษาลาว |
| Long lists | Infinite scroll แบบ cursor + **TanStack Query** + **TanStack Virtual** |
| Motion | Animation/transition ใช้ **Motion** ไม่เขียน CSS motion เองเป็นหลัก |

---

## 2.1 List ยาว (Infinite + Virtual)

ใช้เมื่อรายการโตได้เรื่อยๆ (สินค้า, ประวัติขาย, top/list รายงาน ฯลฯ)

```text
API (cursor) → useInfiniteQuery → flat items → useVirtualizer → แถวที่มองเห็น
```

- Backend ส่ง `{ items, nextCursor }`
- Frontend โหลดหน้าถัดไปเมื่อใกล้สุด list
- Virtualize เสมอถ้าคาดว่ามากกว่า ~30–50 แถว หรือโตไม่จำกัด

รายละเอียดแผน: [phases/README.md](../phases/README.md) §มาตรฐาน Frontend UI

## 2.2 Animation (Motion)

- ใช้ `motion/react` สำหรับเข้า/ออกหน้า, sheet, feedback
- ไม่พึ่ง `@keyframes` / CSS transition ยาวๆ ใน stylesheet ของฟีเจอร์
- Checkout: motion สั้น ชัด ไม่หน่วงการแตะ

---

## 3. Information Architecture

### Bottom navigation (หลัก)

| Tab | Route แนวทาง | Admin | Cashier |
| --- | --- | --- | --- |
| ขาย | `/checkout` | เห็น | เห็น |
| สินค้า | `/products` | เห็น | ซ่อน |
| รายงาน | `/reports` | เห็น | ซ่อน* |
| เพิ่มเติม | `/more` หรือ sheet | เห็น | เห็น (จำกัด) |

\* Cashier เข้าถึงประวัติกะ / X-Z ของตนผ่านเมนูย่อยในหน้าขายหรือ More — ไม่ใช่รายงานรวม

### โครงจอมาตรฐาน

```text
┌─────────────────────────┐
│ Status bar (safe area)  │
│ App header              │  ← ชื่อหน้า + sync/offline + โปรไฟล์
├─────────────────────────┤
│                         │
│     Main content        │  ← scroll ได้
│                         │
├─────────────────────────┤
│ Sticky action (ถ้ามี)   │  ← ยอดรวม / ปุ่มชำระ
├─────────────────────────┤
│ Bottom tabs             │
│ (home indicator safe)   │
└─────────────────────────┘
```

### Header ร่วม
- ซ้าย: ชื่อหน้า หรือกลับ
- กลาง/ขวา: **Network pill** — `ออนไลน์` / `ออฟไลน์` / `กำลังซิงก์ (n)`
- ขวาสุด: โปรไฟล์ (ชื่อสั้น + role) → ออกจากระบบ

---

## 4. Design System (ปฏิบัติ)

ใช้ component จาก shadcn ที่มีใน native เป็นฐาน

### ขนาดสัมผัส
| องค์ประกอบ | ขนาดแนะนำ |
| --- | --- |
| ปุ่มหลัก | สูง ≥ 48px, กว้างเต็มหรือครึ่งแถว |
| ปุ่มไอคอน | ≥ 44×44px |
| แถวรายการสินค้า/ตะกร้า | สูง ≥ 56px |
| ช่องค้นหา | สูง ≥ 48px |

### ลำดับตัวอักษร (Typography scale)
| ใช้กับ | แนวทาง |
| --- | --- |
| ยอดสุทธิ / เงินทอน | text-2xl–3xl, tabular nums, semibold |
| ราคาในรายการ | text-base–lg, tabular nums |
| ชื่อสินค้า | text-sm–base, ตัดบรรทัด 1–2 บรรทัด |
| ป้ายกำกับ / helper | text-xs, muted |

### สีสถานะ (ความหมาย ไม่ล็อก hex)
| สถานะ | ความหมาย |
| --- | --- |
| Success / Online | พร้อมใช้งาน, sync สำเร็จ |
| Warning | Offline, สต็อกต่ำ, sync รอ |
| Danger | error, เงินไม่พอ, สินค้าไม่พบ |
| Muted | ข้อมูลรอง, disabled |

### ภาษา UI
- ข้อความที่ผู้ใช้เห็น (ป้าย, ปุ่ม, ข้อความ error, aria-label) ใช้ **ภาษาลาว** เป็นหลัก — ไม่ใส่ข้อความอังกฤษใน UI ยกเว้นชื่อแบรนด์/อีเมล demo
- ตัวเลขเงิน: **กีบ** จัดรูปแบบคั่นหลักพัน + tabular figures

### ไม่ทำใน UI ขาย
- ไม่ใช้การ์ดซ้อนหลายชั้นในหน้า Checkout
- ไม่ใส่แดชบอร์ดสถิติในหน้าแรกของ Cashier
- ไม่บังคับโหมดมืดเป็นค่าเริ่มต้น — ตาม theme ระบบ/การตั้งค่า

---

## 5. สิทธิ์ที่สะท้อนใน UI

| องค์ประกอบ UI | Admin | Cashier |
| --- | --- | --- |
| Tab สินค้า | แสดง | ซ่อน |
| ราคาทุนในฟอร์มสินค้า | แสดง | — (เข้าหน้าไม่ได้) |
| Tab รายงานรวม | แสดง | ซ่อน |
| ประวัติขายกะตน | แสดง | แสดง |
| Settings ใบเสร็จ/ร้าน | แสดง | ซ่อน |
| ปุ่ม Sync | แสดง | แสดง |

> กันที่ UI อย่างเดียวไม่พอ — API ต้องบล็อกตาม docs 04 ด้วย

---

## 6. Flow หลัก (ภาพรวม)

```text
Login → (เปิดกะ ถ้ามี) → Checkout
                              ├─ สแกน/ค้นหา → ตะกร้า → ชำระ → ใบเสร็จ
                              ├─ (Admin) สินค้า / สต็อก
                              ├─ (Admin) รายงาน
                              └─ ปิดกะ (X/Z)
```

รายละเอียดหน้าจออยู่ไฟล์ย่อยในโฟลเดอร์นี้
