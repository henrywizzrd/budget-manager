# Feature Specification: MYX v1 — Money Saver for Students

**Feature Branch**: `myx-setup`

**Created**: 2026-11-21

**Status**: Draft

**Input**: User description: "MYX v1: money-saver app for students and people in financial hardship, bilingual EN/VI, accounts and cloud sync. Must include themes (light/dark plus custom), an AI agent assistant that answers money questions, logs transactions from natural language (VI/EN), suggests savings and can take actions with confirmation; offline parser by default, cloud AI optional; money-saver essentials: daily safe-to-spend until next payday, monthly and category budgets, quick income/expense logging, recurring bills with reminders, debts and installments, savings goals and emergency fund, reports and trends, reminders, data export and account deletion. Free core, paid Pro for convenience features. Builds on the existing budget-manager app."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Know how much I can spend today (Priority: P1)

A student sets up their money situation in under two minutes: current balance, when the next money
arrives (salary, allowance from family, scholarship) and fixed costs before then (rent, utilities,
tuition). The home screen then shows one number: how much they can safely spend today. Each time
they log an expense, the number updates. Unspent money rolls over to the following days.

**Why this priority**: This is the core promise of MYX and the main difference from apps that only
record spending.

**Independent Test**: Complete onboarding with a balance, payday and two fixed costs, log three
expenses, and check that the daily number matches the expected calculation.

**Acceptance Scenarios**:

1. **Given** a balance of 3,000,000đ, payday in 10 days and 1,000,000đ of bills due before then,
   **When** the user opens the home screen, **Then** it shows 200,000đ safe to spend today.
2. **Given** 200,000đ safe today, **When** the user logs a 50,000đ expense, **Then** the home
   screen shows 150,000đ left for today.
3. **Given** the user spent only 100,000đ of 200,000đ yesterday, **When** a new day starts,
   **Then** today's allowance is recalculated from the remaining money and is higher than before.
4. **Given** spending already exceeds the money available until payday, **When** the user opens
   the home screen, **Then** it shows a calm warning with the shortfall and 1–3 concrete
   suggestions, never shaming language.

---

### User Story 2 - Log money in seconds, in Vietnamese or English (Priority: P1)

The user types or pastes a natural sentence ("trưa bún bò 50k, xăng 80k" or "lunch 50k, bus 7k")
and MYX turns it into separate transactions with amounts, categories and times. A manual form is
also available. This works with no internet connection.

**Why this priority**: Logging must be effortless or users stop using the app; it feeds every other
feature.

**Independent Test**: In airplane mode, enter a sentence with three items in each language and
confirm three correct transactions are created after a review step.

**Acceptance Scenarios**:

1. **Given** no network, **When** the user enters "cà phê 35k, ăn tối 1tr2", **Then** two
   expenses (35,000đ and 1,200,000đ) appear for review with suggested categories.
2. **Given** the review list, **When** the user edits a category and confirms, **Then** the
   transactions are saved and the safe-to-spend number updates.
3. **Given** a sentence describing income ("mẹ cho 2tr"), **When** parsed, **Then** it is saved
   as income, not expense.

---

### User Story 3 - Account, sync and my data (Priority: P1)

The user can start using MYX immediately without an account. When they create an account (email
or a supported social login), their data syncs to the cloud and to a second device. They can
export all their data and permanently delete their account from inside the app.

**Why this priority**: Required by both app stores, protects users from losing data when they change
phones, and is the foundation for cloud AI and Pro.

**Independent Test**: Use the app as a guest, sign up, install on a second phone, sign in and see
the same data; then export and delete the account.

**Acceptance Scenarios**:

1. **Given** a guest with existing local data, **When** they sign up, **Then** all local data is
   kept and uploaded to their account.
2. **Given** changes made offline on one device, **When** it reconnects, **Then** those changes
   appear on the other signed-in device without duplicates.
3. **Given** a signed-in user, **When** they choose "Delete account" and confirm, **Then** their
   cloud data is permanently removed and they are signed out.
4. **Given** any user, **When** they choose "Export data", **Then** they receive a file with all
   their transactions, budgets, bills, debts and goals.

---

### User Story 4 - Bills, debts and installments never surprise me (Priority: P2)

The user records recurring bills (rent, phone, subscriptions) and debts in both directions (money I
owe, money owed to me, including installment plans). MYX reminds them before each due date,
reserves upcoming bills in the safe-to-spend number, and tracks remaining debt.

**Why this priority**: Missed payments and forgotten debts are a major source of stress and fees for
the target users.

**Independent Test**: Create a monthly bill and a 6-month installment, verify reminders fire before
due dates and the remaining balance decreases after each payment is marked.

**Acceptance Scenarios**:

1. **Given** rent of 2,500,000đ due on the 5th, **When** it is 2 days before, **Then** the user
   receives a reminder in their chosen language.
2. **Given** an installment of 6 × 500,000đ, **When** the user marks one payment as paid,
   **Then** the remaining debt shows 2,500,000đ and 5 payments left.
3. **Given** a friend owes the user 100,000đ, **When** the user marks it settled, **Then** it
   is recorded as income and removed from the open list.

---

### User Story 5 - Budgets, savings goals and emergency fund (Priority: P2)

The user sets a monthly budget and optional per-category limits, creates savings goals (a laptop, a
trip) and a small emergency fund with a daily or weekly target they can afford. MYX shows progress
and warns when a category is close to its limit.

**Why this priority**: Turns "surviving the month" into building a small cushion.

**Independent Test**: Set a category limit, exceed 80% of it, confirm the warning; create a goal and
add contributions, confirm progress.

**Acceptance Scenarios**:

1. **Given** a food limit of 1,500,000đ, **When** spending reaches 1,200,000đ, **Then** the user
   sees a "close to limit" warning.
2. **Given** an emergency fund goal of 10,000đ per day, **When** the user taps "Saved today",
   **Then** the fund balance increases and the streak updates.
3. **Given** money moved to a goal, **When** safe-to-spend is calculated, **Then** that money is
   no longer counted as spendable.

---

### User Story 6 - AI money assistant that can act for me (Priority: P2)

The user chats with an assistant in Vietnamese or English. It answers questions about their money
("How much did I spend on coffee this month?"), explains trends, suggests where to save, and can
propose actions (add a transaction, set a budget, create a goal, add a bill). Every action is shown
as a card the user must confirm before anything changes. A basic offline assistant is always
available; a smarter cloud assistant is available when online.

**Why this priority**: A key differentiator, but the app is useful without it.

**Independent Test**: Ask five predefined questions and request two actions; verify answers match the
data and that nothing changes until the user confirms.

**Acceptance Scenarios**:

1. **Given** coffee expenses totaling 420,000đ this month, **When** the user asks "tháng này tiêu
   cà phê bao nhiêu?", **Then** the assistant answers 420,000đ.
2. **Given** the user says "set my food budget to 1.5 million", **When** the assistant replies,
   **Then** it shows a confirmation card and the budget changes only after the user taps Confirm.
3. **Given** no network, **When** the user asks a supported question, **Then** the offline
   assistant answers and clearly indicates it is in offline mode.
4. **Given** any request, **When** the assistant responds, **Then** it never recommends taking a
   loan, credit, or "buy now pay later" product.

---

### User Story 7 - Themes and language that feel like mine (Priority: P3)

The user picks Vietnamese or English, light, dark or follow-system mode, and a color theme from a
gallery. Their choices apply to every screen instantly and follow them to other devices.

**Why this priority**: Improves retention and is a natural Pro upsell, but not essential to manage
money.

**Independent Test**: Switch language and three themes; check every main screen uses the new text
and colors with no untranslated or unreadable elements.

**Acceptance Scenarios**:

1. **Given** the app in Vietnamese, **When** the user switches to English, **Then** all screens,
   notifications and assistant replies switch to English.
2. **Given** a selected theme, **When** the user opens any screen, **Then** text remains readable
   (sufficient contrast) in both light and dark modes.
3. **Given** a free user, **When** they open the theme gallery, **Then** at least 3 themes are free
   and Pro themes are clearly marked.

---

### User Story 8 - Reports and trends (Priority: P3)

The user sees weekly and monthly summaries: spending by category, comparison with last month,
biggest expenses, and savings progress.

**Why this priority**: Helps reflection and planning; depends on data from earlier stories.

**Independent Test**: With six weeks of sample data, open reports and verify category totals and
month-over-month change.

**Acceptance Scenarios**:

1. **Given** two months of data, **When** the user opens the monthly report, **Then** it shows
   totals per category and the percentage change from last month.

---

### User Story 9 - MYX Pro (Priority: P3)

The user can upgrade to Pro for convenience features: the cloud AI assistant with higher usage
limits, extra themes, advanced reports and export formats. Core features remain fully usable for
free.

**Why this priority**: Revenue, but only after the free product is solid.

**Independent Test**: As a free user, confirm all P1 features work; purchase Pro in a store sandbox
and confirm Pro features unlock on all signed-in devices; restore purchase works.

**Acceptance Scenarios**:

1. **Given** a free user, **When** they use safe-to-spend, logging, bills, debts, budgets or goals,
   **Then** no paywall appears.
2. **Given** a purchase completed on iOS, **When** the user signs in on another device of the same
   platform, **Then** Pro is active after "Restore purchases".

---

### User Story 10 - Navigation dock and today chip (Priority: P1)

The app has a floating frosted dock with three tabs (Home, History, Assistant) and a separate round
"+" button. Above it, a chip shows "Left today" with a small progress ring and a one-line note: a
pen icon with "Note" when empty, or the user's own note. Pressing and holding the tab bar turns the
selection into a magnifier lens that follows the finger and snaps to the nearest tab on release.
Scrolling down collapses the bar into a round button and tucks the chip beside it; scrolling up
expands it again. Budget and Bills open from Home.

**Why this priority**: It is how every screen is reached and keeps the key number always visible.

**Independent Test**: Switch tabs by tap and by hold-drag, scroll a long screen down and up, write
and clear a note.

**Acceptance Scenarios**:

1. **Given** the Home tab, **When** the user holds the bar and drags to History and releases,
   **Then** History opens and exactly one haptic tick fired per tab crossed.
2. **Given** a long list, **When** the user scrolls down, **Then** the dock collapses; **When** they
   scroll up or reach the top, **Then** it expands.
3. **Given** no note, **When** the user taps the chip and saves "cook at home tonight", **Then** the
   chip shows that note under the remaining amount.
4. **Given** Reduce Motion is on, **When** tabs change, **Then** there is no stretch, lens or
   overshoot, but the new selection is visible immediately.

---

### User Story 11 - Several wallets and money jars (Priority: P1)

The user keeps money in cash, a bank account and e-wallets. Each transaction belongs to a wallet,
transfers between wallets are not counted as spending, and the total balance is the sum. When
income arrives, the user can split it into jars (for example food 50%, study 10%, savings 10%) with
one tap using a saved split.

**Why this priority**: Without wallets the balance is wrong for most users, which breaks
safe-to-spend.

**Independent Test**: Create three wallets, transfer between two, log income and apply a jar split.

**Acceptance Scenarios**:

1. **Given** 500,000đ cash and 2,000,000đ in the bank, **When** the user moves 300,000đ from bank
   to cash, **Then** the total stays 2,500,000đ and no expense is recorded.
2. **Given** a saved split, **When** 4,000,000đ income is logged, **Then** MYX proposes the jar
   amounts and applies them after confirmation.

---

### User Story 12 - Privacy lock and hidden amounts (Priority: P1)

The user can require Face ID, fingerprint or a PIN to open MYX, and can hide all amounts with one
tap (shown as •••) when using the app in public.

**Independent Test**: Enable the lock, background the app, reopen and unlock; toggle hidden amounts.

**Acceptance Scenarios**:

1. **Given** the lock is on, **When** the app returns from the background after the chosen delay,
   **Then** content is covered until the user authenticates.
2. **Given** hidden amounts, **When** any screen or widget renders, **Then** money values are masked.

---

### User Story 13 - Daily and weekly recap, monthly story (Priority: P2)

Each evening MYX sends a short recap (spent today, left over, streak). On Sunday a weekly summary
arrives. At month end the user gets a shareable recap card (top categories, biggest saving, streak)
they can post as an image.

**Independent Test**: With sample data, trigger the daily and weekly recap and generate the monthly
card image.

**Acceptance Scenarios**:

1. **Given** recap time 21:00, **When** it is 21:00, **Then** a notification shows today's spending
   and remaining amount in the user's language.
2. **Given** month end, **When** the user opens the recap, **Then** they can share it as an image
   that contains no account details.

---

### User Story 14 - Smarter assistant tools (Priority: P2)

The assistant can answer "Can I afford it?" (impact of a purchase on the daily allowance or how many
weeks of saving it needs), audit subscriptions (yearly total, plans not touched for a while), spot
unusual spending ("eating out doubled this week") and learn from category corrections.

**Independent Test**: Ask about a 2,000,000đ purchase, open the subscription audit, change a
category twice and confirm the third similar entry is auto-categorised.

**Acceptance Scenarios**:

1. **Given** 203,500đ per day and 10 days left, **When** the user asks if they can buy a 500,000đ
   item now, **Then** MYX shows the new daily amount (153,500đ) and an alternative saving plan.
2. **Given** three subscriptions, **When** the audit opens, **Then** it shows the monthly and yearly
   totals and the next renewal of each.

---

### User Story 15 - Survival mode (Priority: P2)

When money will not last until payday, MYX switches Home into a calm survival mode: a minimum daily
plan, which bills can wait and which cannot, and a clear warning about high-interest lending apps.

**Acceptance Scenarios**:

1. **Given** a shortfall, **When** Home opens, **Then** survival mode shows a daily minimum and
   never suggests borrowing from lending apps.

---

### User Story 16 - Home screen and lock screen widget (Priority: P2)

The user adds a MYX widget showing "Left today" and the next bill. It updates after each change and
respects hidden amounts.

**Acceptance Scenarios**:

1. **Given** the widget is added, **When** an expense is logged, **Then** the widget shows the new
   amount within a few seconds.

---

### User Story 17 - Subscription reminders (Priority: P1)

The user adds paid subscriptions (name, type icon, price, monthly or yearly, next renewal date) and
chooses to be reminded 1, 3 or 7 days before renewal. Upcoming renewals before payday are reserved
in safe-to-spend.

**Acceptance Scenarios**:

1. **Given** Apple Music renews on 26/11 with a 3-day reminder, **When** it is 23/11, **Then** a
   notification says it renews in 3 days and how much will be charged.

---

### Later (v2) stories, kept here so the design leaves room for them

- **Receipt scan**: photograph a receipt and prefill the transaction.
- **Voice entry**: speak "lunch fifty k" and get the same review as typed entry.
- **Android bank notifications**: read banking-app notifications to log transactions automatically
  (opt-in, Android only).
- **Group split with VietQR**: split a bill with friends, track who paid, share a payment QR.
- **Micro-lessons**: short money lessons for students, unlocked by streaks.

---

### Edge Cases

- Payday is today or already passed: the user is prompted to set the next payday; the allowance
  uses the remaining days of the month until they do.
- Irregular income (freelance, family transfers with no fixed date): the user can choose "no fixed
  payday" and set a planning period (e.g. 7 or 30 days).
- Balance is zero or negative: safe-to-spend shows 0 with the shortfall, never a negative daily
  allowance.
- The same transaction is edited on two devices while offline: the most recent change wins and the
  other version is not silently lost (it remains in history).
- Parser cannot understand a sentence: the user gets the manual form prefilled with what was
  recognized.
- Cloud AI unavailable or quota exceeded: the assistant falls back to offline mode with a notice.
- Notifications permission denied: reminders appear in-app on the home screen instead.
- Currency other than VND: amounts are stored with their currency; v1 does not convert between
  currencies.

## Requirements *(mandatory)*

### Functional Requirements

**Safe-to-spend**

- **FR-001**: System MUST calculate a daily safe-to-spend amount as (available money − reserved
  upcoming bills and debt payments due before the next payday − money set aside for goals) ÷ days
  remaining until the next payday, recalculated after every change and at the start of each day.
- **FR-002**: System MUST let users define one or more income sources with amount and schedule
  (fixed day, every N days, or no fixed date).
- **FR-003**: System MUST never display a negative daily allowance; when money is short it MUST show
  the shortfall and suggestions.

**Logging**

- **FR-004**: Users MUST be able to log income and expenses through natural-language text in
  Vietnamese and English, with a review step before saving.
- **FR-005**: Natural-language logging MUST work fully offline.
- **FR-006**: Users MUST be able to add, edit and delete transactions manually, with category, date,
  note and amount.
- **FR-007**: System MUST provide default categories in both languages and let users add custom ones.

**Accounts, sync and data rights**

- **FR-008**: Users MUST be able to use the app without an account (guest mode) with data stored on
  the device.
- **FR-009**: Users MUST be able to create an account with email and password, plus Sign in with
  Apple on iOS and Google sign-in on Android and iOS.
- **FR-010**: On sign-up, existing guest data MUST be migrated to the account without loss.
- **FR-011**: Data MUST sync across signed-in devices, and changes made offline MUST sync when the
  device reconnects.
- **FR-012**: Each user MUST only be able to read and change their own data.
- **FR-013**: Users MUST be able to export all their data to a file (CSV for free users; additional
  formats MAY be Pro).
- **FR-014**: Users MUST be able to permanently delete their account and all associated cloud data
  from inside the app.

**Bills and debts**

- **FR-015**: Users MUST be able to create recurring bills (weekly, monthly, yearly, custom) with
  amount, due date and reminder lead time.
- **FR-016**: Users MUST be able to record debts they owe and money owed to them, optionally as
  installment plans, and mark individual payments as paid.
- **FR-017**: Upcoming bills and installment payments due before the next payday MUST be reserved in
  the safe-to-spend calculation.

**Budgets and goals**

- **FR-018**: Users MUST be able to set a monthly budget and per-category limits, with warnings at
  80% and 100%.
- **FR-019**: Users MUST be able to create savings goals with a target amount and optional deadline,
  and record contributions.
- **FR-020**: System MUST offer an emergency fund goal with a small recurring target and a savings
  streak.

**AI assistant**

- **FR-021**: Users MUST be able to chat with the assistant in Vietnamese or English about their own
  data (totals, comparisons, forecasts, savings suggestions).
- **FR-022**: The assistant MUST be able to propose actions: add or edit a transaction, set a budget,
  create a goal, add a bill or debt. No action may change data until the user confirms it.
- **FR-023**: An offline assistant MUST always be available; the cloud assistant MUST be used only
  when online and MUST fall back to offline mode on failure.
- **FR-024**: The assistant MUST NOT recommend loans, credit cards, "buy now pay later" or gambling,
  and MUST use supportive, non-judgmental language.
- **FR-025**: Only the minimum data needed to answer a question MAY be sent to the cloud assistant,
  and users MUST be told when the cloud assistant is in use.

**Notifications**

- **FR-026**: System MUST send local reminders for bills, installments, goal contributions and an
  optional daily logging reminder, each individually switchable.
- **FR-027**: Notifications MUST be in the user's selected language.

**Themes and language**

- **FR-028**: Users MUST be able to choose Vietnamese or English; the default follows the device
  language (Vietnamese if the device is Vietnamese, otherwise English).
- **FR-029**: Users MUST be able to choose light, dark or system appearance and a color theme from a
  gallery; at least 3 themes MUST be free.
- **FR-030**: Theme and language choices MUST apply instantly and sync to other devices for signed-in
  users.

**Reports**

- **FR-031**: System MUST show weekly and monthly reports with totals by category, comparison with
  the previous period and largest expenses.

**Pro and policy**

- **FR-032**: System MUST offer a Pro purchase through each store's in-app purchase system, with
  restore purchases.
- **FR-033**: Features covered by FR-001 to FR-020, FR-026 and the free themes MUST remain available
  without payment.
- **FR-034**: The app MUST NOT display advertising for loans, credit, "buy now pay later", gambling or
  crypto.

**Navigation and UI**

- **FR-035**: The app MUST use a floating frosted dock with tabs Home, History and Assistant, a separate
  round add button, and a today chip (remaining amount, progress ring, note) above it.
- **FR-036**: Holding or dragging on the dock MUST show a magnifier lens that follows the finger and
  snaps to the nearest tab; tapping MUST slide the selection; one haptic per tab change.
- **FR-037**: The dock MUST collapse when scrolling down and expand when scrolling up or at the top.
- **FR-038**: All motion MUST respect Reduce Motion and Reduce Transparency settings.
- **FR-039**: History MUST list transactions grouped by day with search (accent-insensitive) and
  income/expense filters, and allow deleting a transaction with all totals updated.
- **FR-040**: Home MUST show weekly and monthly spending as a bar chart and daily spending as a line
  chart with the safe daily level.
- **FR-041**: Categories MUST use the MYX icon set (two-tone icons in coloured tiles, VI/EN names).

**Wallets, jars and templates**

- **FR-042**: Users MUST be able to create wallets (cash, bank, e-wallet, other), assign each
  transaction to a wallet and transfer between wallets without counting it as spending.
- **FR-043**: Users MUST be able to save an income split into jars and apply it when income arrives.
- **FR-044**: Users MUST be able to save quick templates and log one with a single tap.

**Privacy**

- **FR-045**: Users MUST be able to lock the app with device biometrics or a PIN, with a selectable
  re-lock delay.
- **FR-046**: Users MUST be able to hide all money amounts across the app and widgets.

**Recaps**

- **FR-047**: System MUST send an optional daily recap at a user-chosen time and a weekly summary.
- **FR-048**: System MUST generate a monthly recap card that can be shared as an image without
  account identifiers.

**Assistant tools**

- **FR-049**: The assistant MUST answer affordability questions using the safe-to-spend model.
- **FR-050**: The assistant MUST provide a subscription audit with monthly and yearly totals.
- **FR-051**: System MUST flag unusual spending versus the user's recent weeks.
- **FR-052**: Category suggestions MUST learn from the user's corrections on the device.

**Survival, widgets, subscriptions**

- **FR-053**: When a shortfall exists, Home MUST switch to survival mode (FR-003, FR-024 apply).
- **FR-054**: The app MUST offer a home-screen widget (iOS and Android) and, on iOS, a lock-screen
  widget showing the remaining amount today and the next due item.
- **FR-055**: Users MUST be able to add subscriptions with cycle, next renewal date and a reminder
  1, 3 or 7 days before, editable and deletable; renewals due before payday are reserved.

**Operations**

- **FR-056**: The app MUST report crashes and errors (no money amounts or personal text in reports).

### Key Entities

- **User / Profile**: an account or guest; language, currency, appearance, theme, Pro status.
- **Income Source**: name, amount, schedule (fixed day, every N days, none).
- **Transaction**: income or expense; amount, currency, category, date-time, note, source (manual,
  parser, assistant).
- **Category**: name in VI and EN, icon, type (income or expense), optional monthly limit.
- **Budget**: month, total limit, per-category limits.
- **Bill**: name, amount, recurrence, next due date, reminder lead time, active flag.
- **Debt**: direction (I owe / owed to me), counterparty name, total, optional installment plan,
  payments.
- **Savings Goal**: name, target, deadline, contributions; one goal may be marked as emergency fund.
- **Assistant Conversation**: messages and proposed actions with their confirmed or rejected state.
- **Theme**: identifier, color tokens for light and dark, free or Pro.

- **Wallet**: name, type (cash/bank/e-wallet/other), currency, archived flag; balance is derived.
- **Transfer**: from wallet, to wallet, amount, date.
- **Jar Split**: name, list of (category or goal, percent).
- **Template**: name, amount, category, wallet.
- **Subscription**: name, type icon, price, cycle, next renewal date, reminder lead days, enabled.
- **Daily Note**: date, text (one line, max 80 characters).
- **Category Rule**: learned mapping from words to category.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can finish setup and see their daily safe-to-spend amount in under 2 minutes.
- **SC-002**: Logging a typical expense by sentence takes under 10 seconds from opening the input.
- **SC-003**: At least 90% of common Vietnamese and English expense sentences in a 200-sentence test
  set are parsed with the correct amount and type.
- **SC-004**: Changes made on one device appear on another signed-in device within 10 seconds when
  both are online, and with zero lost records after offline edits in testing.
- **SC-005**: 100% of user-facing text exists in both Vietnamese and English.
- **SC-006**: The assistant answers 95% of the 50 predefined money questions correctly against test
  data, and 0 test actions change data without confirmation.
- **SC-007**: Account deletion removes all cloud data for that user, verified in testing, and the app
  passes App Store and Google Play review on first or second submission.
- **SC-008**: All core features (FR-033) are usable by a free user with no paywall in a full test
  pass.

- **SC-009**: Dock interactions run at the display's frame rate on an iPhone 16 Pro Max and a
  mid-range Android, with no dropped frames during hold-drag in a 10-second test.
- **SC-010**: The widget reflects a new expense within 10 seconds in testing.
- **SC-011**: With the app lock on, no money amount is visible in the app switcher snapshot.

## Assumptions

- Target users are students and people in financial hardship in Vietnam first; English serves
  international students and non-Vietnamese users.
- Default currency is VND; other currencies can be selected but are not converted.
- Guest mode is allowed so users can start instantly; an account is needed only for sync, cloud AI
  and Pro.
- Pro pricing (subscription vs one-time) and exact Pro feature list will be decided before the Pro
  milestone; v1 core ships first.
- Free users keep the existing option of using their own AI key; the MYX cloud assistant is a Pro
  feature with a monthly usage limit.
- Receipt scan, voice entry, Android bank-notification import, group split with VietQR and
  micro-lessons are v2: Expo has no official module for text recognition, speech-to-text or reading
  other apps' notifications, so each needs a library review before it is planned.
- The existing app's parser, offline assistant, insights and screens are reused and extended rather
  than rewritten.
