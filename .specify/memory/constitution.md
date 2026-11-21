# MYX Constitution

## Core Principles

### I. Free Survival Core (NON-NEGOTIABLE)

Features that help a user get through the month MUST stay free forever: logging income and
expenses, the daily spending allowance ("how much can I spend today"), bills and debt tracking
with reminders, savings goals, and the offline Vietnamese parser. Paid tiers MAY add convenience
(advanced AI, extra themes, reports, export) but MUST NOT gate any of these core features.
Rationale: the target users are students and people in financial hardship; locking survival
features behind a paywall defeats the product's purpose.

### II. User Wellbeing Over Revenue

MYX MUST NOT show ads, offers or referral links for loans, credit, "buy now pay later",
gambling, or crypto speculation. The AI assistant MUST NOT recommend borrowing as a solution
and MUST NOT shame users about spending. Notifications MUST be useful and user-controllable,
never manipulative (no fake urgency, no dark patterns in paywalls or cancellation).
Rationale: people under financial stress are the most exposed to predatory products.

### III. Privacy & Security by Default

All user data in Supabase MUST be protected by Row Level Security; every table MUST have RLS
enabled with policies scoped to `auth.uid()`. Secrets (Supabase service role key, AI provider
keys owned by MYX) MUST NOT ship in the app bundle; privileged AI calls MUST go through a
server-side function. Users MUST be able to export and permanently delete their data from
inside the app. Only data needed for a feature is collected.
Rationale: financial data is sensitive, and both stores require account deletion and honest
privacy disclosures.

### IV. Offline-First, Sync Second

The app MUST remain usable with no network: reads and writes go to on-device storage first and
sync to Supabase when online. Sync conflicts MUST be resolved deterministically (last write
wins per record, using server timestamps) and MUST never silently delete user records.
Rationale: students often have limited mobile data or unreliable Wi-Fi.

### V. Bilingual, Mobile-First UX

Every user-facing string MUST come from the i18n catalog with both Vietnamese and English
entries; no hard-coded UI text. Money formatting MUST respect the selected currency and locale
(VND by default). Screens MUST be designed for one-handed phone use first and MUST support the
theme system (light/dark plus custom themes) through shared design tokens, never hard-coded
colors.
Rationale: a single codebase serves VI and EN users and consistent tokens keep themes working.

### VI. Docs-Verified Expo & Supabase Usage

Before writing code that touches an Expo, EAS, React Native or Supabase API, the developer
(human or AI) MUST check the docs that match the installed versions in `package.json`, as
described in `AGENTS.md`. Native configuration MUST go through `app.json` and config plugins;
`ios/` and `android/` MUST NOT be edited by hand. Dependencies MUST be added with
`npx expo install`.
Rationale: Expo ships breaking changes every SDK; memory-based code silently breaks builds.

### VII. Small, Verifiable Milestones

Work MUST be delivered in small milestones, each producing a build the product owner can install
and test. Each milestone MUST pass `npx expo lint` and `npx tsc --noEmit`, and pure logic
(parser, budget math, sync merge) MUST have unit tests. A milestone is done only after the product
owner has tested the release build and approved moving on.
Rationale: the owner tests on real phones; small steps keep regressions easy to find.

## Technology Constraints

- App: Expo (SDK pinned in `package.json`) + React Native + TypeScript, Expo Router in `src/app/`.
- Backend: Supabase (Postgres, Auth, Edge Functions); schema changes only via versioned migrations
  committed to the repo.
- AI: offline parser stays the default; cloud AI is optional and routed through a Supabase Edge
  Function so no MYX-owned key ships in the app.
- Builds: native builds run in the cloud (EAS Build and/or GitHub Actions macOS/Linux runners);
  development happens on Windows without a local Mac.
- Targets: iOS App Store and Google Play; store policies (account deletion, privacy labels,
  subscription rules) are requirements, not afterthoughts.

## Development Workflow & Quality Gates

1. Every feature follows Spec Kit: specify → (clarify) → plan → tasks → implement.
2. Work happens on feature branches with a pull request into `main`; no direct pushes to `main`.
3. Quality gates before a PR is ready: lint, typecheck, unit tests green, both locales complete,
   RLS policies present for any new table.
4. Release builds for testing are produced by CI from a commit tagged `[build]` and published as a
   GitHub prerelease (Android APK and iOS IPA); `[update]` ships an OTA update; untagged commits
   only run checks.
5. Plan changes discovered mid-milestone MUST be raised with the product owner before being made.

## Governance

This constitution overrides other practices in the repository. Amendments require a pull request
that edits this file, states the reason, and is approved by the product owner (Tyson). Versioning
follows semantic versioning: MAJOR for removing or redefining a principle, MINOR for adding a
principle or materially expanding guidance, PATCH for wording fixes. Every spec, plan and PR
review MUST check compliance with these principles; any justified exception MUST be recorded in
the plan's Complexity Tracking section. Runtime development guidance lives in `AGENTS.md`.

**Version**: 1.0.0 | **Ratified**: 2026-11-21 | **Last Amended**: 2026-11-21
