# Starter Admin Native (Tauri 2)

Mobile-first Tauri 2 app with React + TypeScript, managed by Bun.

Docs: [Tauri 2](https://v2.tauri.app/)

## Prerequisites

- [Bun](https://bun.sh/)
- [Rust](https://v2.tauri.app/start/prerequisites/) (`rustup`)
- Android SDK / NDK (`ANDROID_HOME`, `NDK_HOME`)
- Android rust targets:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android
```

iOS requires macOS + Xcode (not available on this Linux host).

## Setup

```bash
bun install
```

Android project is already generated under `src-tauri/gen/android`.

## Develop

```bash
# Android emulator / device
bun run android:dev

# Desktop (optional)
bun run tauri dev

# Frontend only (Vite)
bun run dev
```

## Build

```bash
bun run android:build
```

## UI (shadcn)

[shadcn/ui](https://ui.shadcn.com/) is set up (Radix + Nova, Tailwind v4).

```bash
bunx --bun shadcn@latest add card dialog
```

Components live in `src/components/ui/`.

## Project layout

- `src/` — React frontend (Vite)
- `src/components/ui/` — shadcn components
- `src-tauri/` — Rust / Tauri backend
- `src-tauri/gen/android/` — Android Studio project
