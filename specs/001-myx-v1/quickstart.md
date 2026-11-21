# Quickstart & Validation: MYX v1

## Prerequisites (owner's machine, Windows)

- Node.js 20+, Git, the repo cloned.
- A Supabase project (URL and anon/publishable key) — values go in `.env` as
  `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (public by design; RLS protects data).
- For phone testing: the latest GitHub prerelease (APK for Android, IPA installed with ESign or
  Sideloadly on iPhone).

## Local checks (every milestone)

```bash
npm install
npx expo lint
npx tsc --noEmit
npm test
```

All four must pass before a `[build]` commit.

## Getting a test build

Push a commit whose message contains `[build]` → GitHub Actions → a new prerelease appears under
Releases with the APK and IPA. `[update]` ships an OTA update to installed builds.

## Acceptance scenarios to run on the phone

| # | Scenario | Expected |
|---|---|---|
| 1 | Onboarding: balance 3,000,000đ, payday in 10 days, bills 1,000,000đ | Home shows 200,000đ today (US1-1) |
| 2 | Log "cà phê 35k, ăn tối 1tr2" in airplane mode | 2 expenses for review (US2-1) |
| 3 | Switch to English, log "lunch 50k, bus 7k" | 2 expenses, English UI (US2, US7-1) |
| 4 | Guest data → sign up → second phone sign in | Same data, no duplicates (US3-1, US3-2) |
| 5 | Edit same transaction on two phones offline, reconnect | Latest edit wins, old version recoverable |
| 6 | Add rent due in 2 days | Reminder fires; amount reserved on Home (US4-1) |
| 7 | Installment 6 × 500,000đ, pay one | 2,500,000đ and 5 payments left (US4-2) |
| 8 | Food limit 1,500,000đ, spend 1,200,000đ | "Close to limit" warning (US5-1) |
| 9 | Ask assistant "set my food budget to 1.5 million" | Confirmation card; nothing changes until Confirm (US6-2) |
| 10 | Assistant offline | Answers with offline badge (US6-3) |
| 11 | Switch 3 themes in light and dark | All screens readable (US7-2) |
| 12 | Export data, then delete account | CSV received; account gone, signed out (US3-3, US3-4) |
| 13 | Free user full pass | No paywall on core features (US9-1) |
