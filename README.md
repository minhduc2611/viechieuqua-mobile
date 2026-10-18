# viechieuqua mobile (Expo)

Field workflows against the same Elysia API as the web app. Plan: `../../tech-plan/10-mobile.md`.
Task log: `../../task-manager/mobile-backlog.md`.

## Setup

```sh
bun install
cp .env.example .env
bun start          # Expo Go
```

## `EXPO_PUBLIC_API_URL`

| Client | URL |
|---|---|
| iOS Simulator | `http://localhost:3001` |
| Android emulator | `http://10.0.2.2:3001` |
| Physical device | `http://<your-lan-ip>:3001` (phone + API host on same LAN) |
| Prod | `https://api.viechieuqua.com` |

Backend must be reachable; CORS does not apply to native `fetch`.

## Auth

Session token stored in `expo-secure-store` as `better-auth.session_token`, sent as a `Cookie`
header (see `tech-plan/04-auth.md`). Sign-in/up on `/login`.

## Tabs

**Today** (time — M1) · **Projects** · **More** (company picker + sign out)

## Remote

Own git repo (created by `create-expo-app`). Suggested GitHub remote: `viechieuqua-mobile`.

## EAS

`eas.json` has a **preview** profile (internal Android APK). Needs your Expo login:

```sh
bunx eas-cli login
bunx eas init          # links projectId into app.json
bunx eas build --profile preview --platform android
```
