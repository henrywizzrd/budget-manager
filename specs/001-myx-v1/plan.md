# Implementation Plan: MYX v1 — Money Saver for Students

**Branch**: `myx-setup` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-myx-v1/spec.md`

## Summary

Evolve the existing Expo app (offline Vietnamese parser, offline assistant, budgets, insights)
into MYX: a bilingual, theme-able, local-first money saver whose home screen answers "how much
can I spend today". Data lives in SQLite on the device and syncs to Supabase (Auth + Postgres with
RLS). A Supabase Edge Function hosts the cloud AI agent, which only *proposes* actions that the
user confirms on the device. Pro (cloud AI quota, extra themes, advanced reports) is sold through
RevenueCat. Test builds come from the owner's existing `[build]` GitHub Actions release flow.

## Technical Context

**Language/Version**: TypeScript (strict), React 19.3, React Native 0.88, Expo SDK 58

**Primary Dependencies**: expo-router, expo-sqlite, @supabase/supabase-js, expo-localization,
expo-notifications, expo-apple-authentication, native Google sign-in (library verified at
implementation), react-native-purchases (RevenueCat), react-native-reanimated 4.7.1 + react-native-worklets 0.13.0,
react-native-gesture-handler ~3.3.0, expo-haptics, expo-blur, expo-glass-effect (same versions as the
owner's ZYX app on SDK 58), expo-local-authentication, expo-widgets, react-native-view-shot +
expo-sharing, Sentry, existing react-native-svg and Be Vietnam Pro fonts

**Storage**: SQLite on device (source of truth for the UI); Supabase Postgres for sync

**Testing**: Jest with jest-expo for pure logic; manual acceptance via `quickstart.md`

**Target Platform**: iOS and Android phones (portrait); web build kept working for quick previews

**Project Type**: mobile app + Supabase backend (migrations and Edge Functions in the same repo)

**Performance Goals**: home screen ready < 1 s after launch on a mid-range Android; parsing a
sentence < 100 ms on device; sync of 1,000 changed rows < 10 s

**Constraints**: fully usable offline; no MYX-owned secrets in the bundle; owner develops on
Windows with no Mac; only cloud builds

**Scale/Scope**: ~12 screens, 11 tables, 3 Edge Functions; early target 10k users (fits Supabase
free/pro tiers — pricing checked before launch)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | How the plan complies | Status |
|---|---|---|
| I. Free Survival Core | Pro gates only cloud AI, extra themes, advanced reports/export formats; FR-033 tested in quickstart #13 | Pass |
| II. User Wellbeing | No ad SDK at all; assistant prompt + client filter block loan/BNPL/gambling/crypto suggestions | Pass |
| III. Privacy & Security | RLS on every table; provider key only in Edge Function secrets; in-app export and delete-account | Pass |
| IV. Offline-First | SQLite first, background sync, deterministic LWW + conflict backup | Pass |
| V. Bilingual, Mobile-First | typed VI/EN catalogs (missing key = type error); theme tokens replace hard-coded colors | Pass |
| VI. Docs-Verified | research.md lists items to verify against SDK 58 docs before coding | Pass |
| VII. Small Milestones | 9 milestones below, each ends with a `[build]` prerelease and owner approval | Pass |

Post-design re-check: still passing; no violations, so Complexity Tracking is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-myx-v1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── assistant-actions.md
│   └── sync-and-security.md
├── checklists/requirements.md
└── tasks.md             # created later by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app/                      # Expo Router screens (existing tabs kept and extended)
│   ├── (tabs)/index.tsx      # Home: safe-to-spend
│   ├── (tabs)/budget.tsx     # budgets + goals
│   ├── (tabs)/assistant.tsx  # chat + action cards
│   ├── (tabs)/settings.tsx   # language, theme, account, export, delete
│   ├── add.tsx  history.tsx
│   ├── onboarding.tsx        # new
│   ├── bills.tsx  debts.tsx  reports.tsx  auth.tsx  pro.tsx   # new
│   └── _layout.tsx
├── lib/                      # pure logic, unit-tested
│   ├── parser.ts             # existing VI parser + EN rules
│   ├── assistant.ts          # existing offline assistant, now returns actions
│   ├── insights.ts  categories.ts  format.ts  types.ts
│   ├── safeToSpend.ts        # new (formula in data-model.md)
│   └── actions.ts            # new: validate + execute assistant actions
├── data/                     # new
│   ├── db.ts                 # expo-sqlite schema + local migrations
│   ├── repo/*.ts             # per-table read/write
│   ├── sync.ts               # push/pull per contracts/sync-and-security.md
│   └── migrateLegacy.ts      # one-time import from AsyncStorage key budget-manager/data/v1
├── services/                 # new
│   ├── supabase.ts  auth.ts  notifications.ts  purchases.ts  cloudAssistant.ts
├── i18n/                     # new: vi.ts, en.ts, index.ts (t(), useLanguage)
├── theme/                    # new: tokens.ts, themes/*.ts, ThemeProvider.tsx
├── components/               # shared UI moved out of screens
│   └── dock/                 # MyxDock, TodayChip, Glass, dockCollapse, haptics, useContentInsets
└── widgets/                  # expo-widgets widget components

supabase/
├── migrations/*.sql
└── functions/
    ├── assistant/
    ├── delete-account/
    └── revenuecat-webhook/

tests/unit/                   # parser, safeToSpend, sync merge, actions, i18n, theme contrast
.github/workflows/release.yml # [build] / [update] / checks
```

**Structure Decision**: single Expo app repo with a `supabase/` folder for backend code. Pure logic
stays in `src/lib` (testable without React Native); storage in `src/data`; side-effectful
integrations in `src/services`. `ios/` and `android/` stay generated (Constitution VI).

## Delivery Milestones (each = one `[build]` or `[update]` release for the owner to test)

| # | Milestone | Covers | Owner tests |
|---|---|---|---|
| M0 | Foundation: CI release workflow, bundle ids, Jest, theme tokens, i18n, MYX icon set, ZYX-style dock (a static glass, b sliding pill, c lens, d collapse, f haptics/reduced motion/insets), tabs Home/History/Assistant with Budget and Bills under Home, Sentry | US10, FR-035–041, FR-056 | Install APK/IPA; tap, hold-drag, fast flick, scroll down/up |
| M1 | SQLite storage, legacy data migration, wallets and transfers, templates | FR-006, FR-007, FR-042, FR-044 | Old data kept; wallet totals |
| M2 | Safe-to-spend, onboarding, income sources, jar split, today chip and note, survival mode | US1, US11, US15, FR-001–003, FR-043, FR-053 | quickstart #1, jar split |
| M3 | Bilingual parser, quick entry review, category learning | US2, FR-004–005, FR-052 | quickstart #2–3 |
| M4 | Supabase auth, sync, export, delete account, app lock, hidden amounts | US3, US12, FR-008–014, FR-045–046 | quickstart #4, #5, #12; lock |
| M5 | Bills, debts, subscriptions with reminders, daily and weekly recap | US4, US17, US13, FR-015–017, FR-026–027, FR-047, FR-055 | quickstart #6–7; renewal reminder |
| M6 | Budgets, goals, history, charts, monthly recap card | US5, US8, FR-018–020, FR-031, FR-039–040, FR-048 | quickstart #8; share card |
| M7 | AI agent: actions, affordability, subscription audit, anomalies | US6, US14, FR-021–025, FR-049–051 | quickstart #9–10 |
| M8 | Widgets (expo-widgets: iOS home/lock, Android home) | US16, FR-054 | widget updates |
| M9 | Theme gallery, Pro (RevenueCat), store listings, privacy labels, submission | US7, US9, FR-032–034 | quickstart #11, #13 |
| v2 | Receipt scan, voice entry, Android bank notifications, group split + VietQR, micro-lessons | Later stories | Each needs a library review first |

M4 needs a Supabase project (URL and publishable key); `[update]` needs `eas init` and an
`EXPO_TOKEN` secret; M9 needs paid Apple Developer and Google Play accounts and a RevenueCat account.

## Complexity Tracking

No constitution violations.
