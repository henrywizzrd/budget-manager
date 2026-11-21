---
description: "Task list for MYX v1, ordered by delivery milestone"
---

# Tasks: MYX v1 — Money Saver for Students

**Input**: Design documents from `/specs/001-myx-v1/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: The constitution (VII) requires unit tests for pure logic (parser, budget math, sync
merge, dock maths). Those tests are listed; UI is verified manually with `quickstart.md` on release
builds.

**Organization**: Phases follow the delivery milestones in `plan.md` (M0–M9). Inside a milestone,
tasks are grouped by user story. Each milestone ends with a `[build]` or `[update]` release and the
owner's approval before the next starts.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: user story from spec.md (US1–US17)
- Paths are relative to the repository root (single Expo project + `supabase/`).


## Progress: test build 2026-11-21 (owner asked for one full build to test)

Done in the test build: dock (US10: a, b, c, d, f), History tab, wallets and transfers, templates, safe-to-spend
with onboarding and survival mode, jar split, bilingual parser with category learning, bills, debts,
subscriptions with reminders, daily/weekly recap notifications, budgets, goals and emergency fund, charts,
monthly recap card, assistant actions (affordability, subscription audit, limits, goals, logging), themes,
hide amounts, app lock, CSV export, Pro screen (no purchase).

Agreed deviations for this build (owner decision, to revisit):
- Storage stays on AsyncStorage (JSON, key `myx/data/v2`, migrates v1); SQLite comes with Supabase sync (M4).
- No Supabase, accounts, cloud AI, RevenueCat, widgets or Sentry yet.
- Strings are VI/EN pairs at the call site (`useL()`), not separate catalog files.
- Unit tests run with `tsx` scripts (`npm test`) instead of Jest.

---

## Phase 1: Setup — M0 part 1 (CI, ids, tooling)

**Purpose**: every later milestone ships through this pipeline.

- [ ] T001 Add `ios.bundleIdentifier` and `android.package` `com.henrywizzrd.myx` in app.json (`expo.ios`, `expo.android`)
- [ ] T002 Add the release workflow (`[build]` → APK + unsigned IPA → GitHub prerelease, `[update]` → OTA, otherwise checks) adapted from ZYX in .github/workflows/build-test-apps.yml
- [ ] T003 Add a `check` job (lint + typecheck + unit tests on every push) in .github/workflows/build-test-apps.yml
- [ ] T004 [P] Add Jest with `jest-expo` (verify SDK 58 setup in docs) and a `test` script in package.json and jest.config.js
- [ ] T005 [P] Move legacy pure-logic tests target folder: create tests/unit/.gitkeep and a first parser smoke test in tests/unit/parser.test.ts
- [ ] T006 Install dock libraries with `npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics expo-blur expo-glass-effect` and confirm versions match research R10 in package.json

---

## Phase 2: Foundational — M0 part 2 (theme, i18n, icons, navigation)

**Purpose**: shared building blocks for every screen. Blocks all user stories.

- [ ] T007 [P] Create design tokens (colours light/dark, spacing, radius, type) in src/theme/tokens.ts
- [ ] T008 [P] Create the 6 themes from the prototype (leaf, sea, clay, matcha, sakura, coal; last 3 Pro) in src/theme/themes.ts
- [ ] T009 Create ThemeProvider + useTheme (appearance light/dark/system, persisted) in src/theme/ThemeProvider.tsx
- [ ] T010 [P] Create typed VI/EN catalogs and `t()`/useLanguage (device default per FR-028) in src/i18n/vi.ts, src/i18n/en.ts, src/i18n/index.ts
- [ ] T011 [P] Generate the MYX icon set as react-native-svg components from design/icons/icons.json in src/components/icons/CategoryIcon.tsx (script: scripts/gen-icons.mjs)
- [ ] T012 Migrate existing screens and src/components/ui.tsx from hard-coded `C.*` colours and Vietnamese strings to tokens and `t()` (src/app/**, src/components/**)
- [ ] T013 Restructure routes: tabs `index` (Home), `history`, `assistant` in src/app/(tabs)/; move src/app/history.tsx into src/app/(tabs)/history.tsx; make budget, bills and settings stack screens under Home (src/app/budget.tsx, src/app/bills.tsx, src/app/settings.tsx)
- [ ] T014 [P] Add a unit test that every key in src/i18n/vi.ts exists in src/i18n/en.ts in tests/unit/i18n.test.ts

**Checkpoint**: app builds, all screens themed and bilingual.

---

## Phase 3: User Story 10 — Dock and today chip (P1) — M0 part 3 🎯

**Goal**: ZYX-style dock (research R10) with Home/History/Assistant, round add button, today chip.

**Independent Test**: tap, hold-drag, fast flick, scroll down/up, write a note (spec US10).

- [ ] T015 [P] [US10] Port glass layer: Liquid Glass for bar and round button, expo-blur for chip and lens, solid fallback for Reduce Transparency in src/components/dock/Glass.tsx
- [ ] T016 [P] [US10] Copy dockCollapse (collapse spring 300/28, thresholds y<30, +4/−6) in src/components/dock/dockCollapse.ts
- [ ] T017 [P] [US10] Haptic helpers (`hapticTick`, `hapticSnap`) with expo-haptics in src/components/dock/haptics.ts
- [ ] T018 [P] [US10] Content insets hook (bottom padding = dock + chip) in src/components/dock/useContentInsets.ts
- [ ] T019 [US10] Milestone (a): static dock layout (bar 62, chip 52, gaps 10/8, round add button) in src/components/dock/MyxDock.tsx
- [ ] T020 [US10] Milestone (b): sliding selection pill with stretch 1.22 → spring 420/32 in src/components/dock/MyxDock.tsx
- [ ] T021 [US10] Milestone (c): hold 170 ms / pan 6 px magnifier lens (spring 600/38, scale 1.18, velocity stretch) with release snap in src/components/dock/MyxDock.tsx
- [ ] T022 [US10] Milestone (d): collapse on scroll for Home, History and Budget lists using dockCollapse in src/components/dock/MyxDock.tsx and screen ScrollViews
- [ ] T023 [US10] TodayChip with progress ring, remaining amount and one-line note (pen + "Note" when empty; data-model.md Daily Note.text max 80) and note sheet in src/components/dock/TodayChip.tsx
- [ ] T024 [US10] Milestone (f): haptics on tab change, Reduce Motion (no stretch/lens/overshoot), content insets on every screen in src/components/dock/MyxDock.tsx
- [ ] T025 [US10] Replace the old tab bar with MyxDock in src/app/(tabs)/_layout.tsx
- [ ] T026 [P] [US10] Unit test the pure dock maths (index from x, lens clamp, velocity stretch cap 0.35) extracted to src/components/dock/dockMath.ts in tests/unit/dockMath.test.ts
- [ ] T027 [US10] Add Sentry crash reporting with amounts and free text scrubbed (FR-056; verify current Expo guide) in src/services/sentry.ts and app.json plugins

**Checkpoint (end of M0)**: `[build]` release; owner tests dock on iPhone 16 Pro Max (iOS 27) and Android.

---

## Phase 4: M1 — Storage, wallets, templates

- [ ] T028 Create SQLite schema for all tables in data-model.md (synced columns `id`, `user_id`, `updated_at`, `deleted_at`, local `dirty`) in src/data/db.ts
- [ ] T029 One-time import from AsyncStorage key `budget-manager/data/v1` in src/data/migrateLegacy.ts
- [ ] T030 [P] Repositories per table in src/data/repo/*.ts
- [ ] T031 [P] [US11] Wallets and transfers (data-model.md Wallet.type enum, Transfer.amount > 0) in src/data/repo/wallets.ts and src/app/wallets.tsx
- [ ] T032 [P] [US11] Quick templates (data-model.md Template) with one-tap logging in src/data/repo/templates.ts and src/components/TemplateBar.tsx
- [ ] T033 [P] Unit tests for migration and wallet totals (transfers excluded from spending) in tests/unit/wallets.test.ts

---

## Phase 5: M2 — Safe-to-spend, onboarding, jars, survival mode

- [ ] T034 [US1] Implement the formula in data-model.md "Derived: safe-to-spend" (reserve bills, debts and subscriptions due before payday) in src/lib/safeToSpend.ts
- [ ] T035 [P] [US1] Unit tests for US1 scenarios 1–4 and US14 affordability example in tests/unit/safeToSpend.test.ts
- [ ] T036 [US1] Income sources (data-model.md income_sources.schedule_type and matching field rules) in src/app/income.tsx
- [ ] T037 [US1] Onboarding (balance per wallet, payday, fixed costs) in src/app/onboarding.tsx
- [ ] T038 [US1] Home hero, minis, links to Budget and Bills, charts placeholder in src/app/(tabs)/index.tsx
- [ ] T039 [US11] Jar split editor and apply-on-income flow (data-model.md Jar Split percentages sum to 100) in src/app/jars.tsx and src/lib/jars.ts
- [ ] T040 [US15] Survival mode on Home when shortfall > 0 (FR-053, FR-024) in src/components/SurvivalCard.tsx

---

## Phase 6: M3 — Bilingual parser and learning

- [ ] T041 [US2] Add English rules beside the Vietnamese ones (amounts k/m/tr, income words) in src/lib/parser.ts
- [ ] T042 [P] [US2] 200-sentence VI/EN test set and accuracy test (SC-003 ≥ 90%) in tests/unit/parser.test.ts
- [ ] T043 [US2] Review step with category picker using the icon set in src/app/add.tsx
- [ ] T044 [US14] On-device category learning from corrections (data-model.md Category Rule) in src/lib/categoryLearning.ts

---

## Phase 7: M4 — Supabase, privacy

- [ ] T045 Supabase migrations for all tables with RLS per contracts/sync-and-security.md in supabase/migrations/
- [ ] T046 Supabase client and AppState auto-refresh (research R2) in src/services/supabase.ts
- [ ] T047 [US3] Auth (email, Apple, Google; verify Google flow) in src/services/auth.ts and src/app/auth.tsx
- [ ] T048 [US3] Push/pull sync with conflict_backup per contracts/sync-and-security.md in src/data/sync.ts
- [ ] T049 [P] [US3] Unit tests for sync merge (last write wins, no silent loss) in tests/unit/sync.test.ts
- [ ] T050 [US3] CSV export and delete-account function in src/lib/export.ts and supabase/functions/delete-account/
- [ ] T051 [US12] App lock with expo-local-authentication and re-lock delay, app-switcher cover in src/services/appLock.ts
- [ ] T052 [US12] Hidden amounts toggle applied by the money formatter and widgets in src/lib/format.ts

---

## Phase 8: M5 — Bills, debts, subscriptions, recaps

- [ ] T053 [US4] Bills screen with pay action (data-model.md bills.recurrence, remind_days_before) in src/app/bills.tsx
- [ ] T054 [US4] Debts and installments (data-model.md debts.direction, status transitions) in src/app/debts.tsx
- [ ] T055 [US17] Subscriptions add/edit/delete with cycle, next renewal, reminder 1/3/7 days (data-model.md Subscription) in src/app/subscription.tsx
- [ ] T056 [US4] Local notification scheduling for bills, installments and subscriptions (verify SDK 58 trigger API) in src/services/notifications.ts
- [ ] T057 [US13] Daily recap at chosen time and Sunday weekly summary in src/services/recaps.ts

---

## Phase 9: M6 — Budgets, goals, history, charts, monthly card

- [ ] T058 [US5] Budget and category limits with 80%/100% warnings in src/app/budget.tsx
- [ ] T059 [US5] Goals and emergency fund streak in src/app/goals.tsx
- [ ] T060 [US10] History tab: day groups, accent-insensitive search, filters, delete with totals updated (FR-039) in src/app/(tabs)/history.tsx
- [ ] T061 [US8] Week/month bar chart and daily line chart with safe level (FR-040) in src/components/charts/SpendBars.tsx and src/components/charts/DailyLine.tsx
- [ ] T062 [US13] Monthly recap card and share as image (research R12) in src/app/recap.tsx

---

## Phase 10: M7 — AI agent

- [ ] T063 [US6] Offline assistant returns actions per contracts/assistant-actions.md in src/lib/assistant.ts
- [ ] T064 [US6] Action validation and execute-after-confirm in src/lib/actions.ts
- [ ] T065 [US6] Edge Function `assistant` with quota (ai_usage) in supabase/functions/assistant/
- [ ] T066 [US14] Affordability answer, subscription audit, anomaly detection in src/lib/insights.ts
- [ ] T067 [P] [US6] Unit tests: no action executes without confirmation, banned-advice filter in tests/unit/actions.test.ts

---

## Phase 11: M8 — Widgets

- [ ] T068 [US16] Install and configure expo-widgets (research R11) in app.json plugins
- [ ] T069 [US16] Home/lock-screen widget showing left today and next due item, masked when hidden in src/widgets/TodayWidget.tsx
- [ ] T070 [US16] Push snapshots after every data change via updateSnapshot in src/services/widgetSync.ts

---

## Phase 12: M9 — Themes, Pro, store

- [ ] T071 [US7] Theme gallery with Pro preview in src/app/settings.tsx
- [ ] T072 [US9] RevenueCat entitlement `pro` and webhook function in src/services/purchases.ts and supabase/functions/revenuecat-webhook/
- [ ] T073 [US9] Pro screen (core features never gated, FR-033) in src/app/pro.tsx
- [ ] T074 Store listings VI/EN, privacy labels, account-deletion link, screenshots in store/ (docs only)

---

## Phase 13: v2 research only

- [ ] T075 [P] Library review for on-device text recognition (receipts), with licence and SDK 58 support, in specs/001-myx-v1/research.md
- [ ] T076 [P] Library review for speech-to-text in VI/EN in specs/001-myx-v1/research.md
- [ ] T077 [P] Feasibility and Google Play policy review for reading banking notifications on Android in specs/001-myx-v1/research.md
- [ ] T078 [P] VietQR payload format review for group split in specs/001-myx-v1/research.md

---

## Phase 14: Polish (every milestone)

- [ ] T079 Run `review-animations` skill on dock and sheets; fix findings in src/components/dock/
- [ ] T080 Accessibility pass: labels, 44pt targets, Dynamic Type in src/app/** and src/components/**
- [ ] T081 Update quickstart.md acceptance table with dock, history, subscriptions, wallets, lock and widget checks in specs/001-myx-v1/quickstart.md

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → Phase 3 (M0) must finish first; M0 ends with a `[build]`.
- M1 (storage) blocks M2–M9. M4 (Supabase) blocks cloud AI in M7 and Pro in M9.
- M5, M6 and M8 can start after M2 in any order; M7 offline parts can start after M3.
- v2 research tasks are independent and do not block v1.

## Parallel Examples

- M0: T007, T008, T010, T011 together; then T015–T018 together before T019.
- M4: T049 (tests) alongside T047 (auth).

## Implementation Strategy

1. MVP = M0 + M1 + M2: themed bilingual app with the dock, wallets and the daily safe-to-spend number.
2. Each milestone: implement → lint, typecheck, unit tests → `[build]` or `[update]` → owner tests
   on device → approval → next milestone.
