# Research: MYX v1

Sources checked on 2026-11-21: Expo docs index (`docs.expo.dev/llms.txt`), "Using Supabase",
"Local-first", "In-app purchases". Items marked **verify at implementation** were not confirmed
against docs yet and MUST be checked (Constitution VI) before code is written.

## R1. Local storage and sync

- **Decision**: `expo-sqlite` as the on-device database, plus a small MYX sync module that pushes
  pending local changes and pulls server changes since the last sync (per-table `updated_at`
  cursor, soft deletes, client-generated UUIDs, last-write-wins on server `updated_at`).
- **Rationale**: Expo docs name `expo-sqlite` as the main recommended persistence option for
  local-first apps. A custom sync over ~9 simple tables is small, fully testable as pure logic and
  adds no vendor dependency. The existing AsyncStorage blob is migrated once into SQLite.
- **Alternatives considered**: Legend-State (docs: Supabase support built in) is the strongest
  alternative if custom sync turns out costly; WatermelonDB (linked from the Expo Supabase guide);
  RxDB (Supabase replication plugin); PowerSync/ElectricSQL (extra hosted service).

## R2. Supabase client and auth

- **Decision**: `@supabase/supabase-js` with `expo-sqlite/localStorage/install` as auth storage,
  `detectSessionInUrl: false`, and auto-refresh started/stopped from `AppState`, as the Expo guide
  shows. Sign in with Apple via `expo-apple-authentication`; Google via native sign-in passing the
  ID token to Supabase (**verify at implementation**: exact library and `signInWithIdToken` flow in
  current Supabase guides). Email + password via Supabase Auth.
- **Rationale**: follows the official Expo guide; ID-token flows avoid browser redirects.
- **Store note**: Apple's review guidelines require an equivalent privacy-focused login option when
  third-party social login is offered; offering Sign in with Apple covers this (**verify** current
  guideline 4.8 wording before submission).

## R3. Cloud AI agent

- **Decision**: a Supabase Edge Function `assistant` that calls an LLM with tool/function calling.
  Tools are read-only queries over a compact data summary sent by the client, plus *proposed*
  actions returned to the client. The client shows confirmation cards and executes confirmed
  actions locally (so they work offline-first and sync normally). The provider key lives only in
  Edge Function secrets. Free users keep the existing bring-your-own Gemini key path; the MYX-hosted
  assistant is Pro with a monthly quota table.
- **Rationale**: Constitution III (no MYX key in the bundle) and FR-022 (no change without
  confirmation). The model choice stays swappable behind the function.
- **Alternatives considered**: calling the LLM directly from the app (leaks key); letting the server
  write to the DB directly (bypasses confirmation and local-first flow).

## R4. Internationalisation

- **Decision**: `expo-localization` for the device locale plus a typed message catalog
  (`src/i18n/vi.ts`, `src/i18n/en.ts`) with a small `t()` helper; i18next only if pluralisation needs
  grow. Parser and offline assistant get English rules next to the Vietnamese ones.
- **Rationale**: two languages, typed keys make a missing translation a compile error (SC-005).

## R5. Themes

- **Decision**: design tokens (`colors`, `spacing`, `radius`, `typography`) in `src/theme/`, each
  theme defining light and dark palettes; a `ThemeProvider` + `useTheme()` hook; all existing
  hard-coded colors (e.g. `C.sub` in screens) migrated to tokens. 3 free themes, more for Pro.
  A contrast check test validates every theme pair (spec US7-2).

## R6. Notifications

- **Decision**: `expo-notifications` scheduled local notifications for bills, installments, goal
  contributions and an optional daily reminder; rescheduled whenever those records change. No push
  server in v1. (**verify at implementation**: scheduling trigger API for SDK 58.)

## R7. In-app purchases (Pro)

- **Decision**: RevenueCat (`react-native-purchases`) for one entitlement `pro` across iOS and
  Android, with a webhook to a Supabase Edge Function that mirrors entitlement into `profiles.is_pro`.
- **Rationale**: Expo docs list it; it handles receipt validation and restore on both stores.
  Requires a development build, which MYX already uses for testing.
- **Alternatives considered**: `expo-iap` (also listed; more server work for receipt validation).
- **Open**: price and subscription vs one-time are decided before the Pro milestone (spec
  Assumptions); RevenueCat pricing to be checked then.

## R8. Builds, testing releases and store submission

- **Decision**: reuse the owner's existing release workflow: commit message containing `[build]`
  → GitHub Actions builds an Android APK and an unsigned iOS IPA (macOS runner) and publishes a
  GitHub prerelease; `[update]` → OTA update (now named Expo Update; `eas` commands unchanged);
  no tag → lint, typecheck and tests only. Store builds and submission use Expo Build/Submit in the
  cloud, so no local Mac is needed.
- **Rationale**: the owner already installs test IPAs with ESign/Sideloadly and APKs directly.
- **Not used**: xtool, because it builds SwiftPM packages, not Expo/React Native apps.

## R9. Testing

- **Decision**: Jest via `jest-expo` for unit tests of pure logic (parser VI/EN, safe-to-spend,
  sync merge, i18n completeness, theme contrast); manual acceptance on release builds following
  `quickstart.md`. (**verify at implementation**: jest-expo setup for SDK 58.)
