# Data Model: MYX v1

The same tables exist locally (SQLite) and in Supabase Postgres. Every synced table has:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | generated on the device |
| `user_id` | uuid | `auth.uid()`; null locally while in guest mode, filled on sign-up |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | set by server trigger on write; sync cursor and conflict winner |
| `deleted_at` | timestamptz null | soft delete so deletions sync |

Local-only column on every table: `dirty` (bool) — row has changes not yet pushed.

## profiles (1 per user)

`display_name`, `language` (`vi`/`en`), `currency` (ISO 4217, default `VND`), `appearance`
(`light`/`dark`/`system`), `theme_id`, `is_pro` (server-written only), `onboarded_at`.

## income_sources

`name`, `amount`, `schedule_type` (`fixed_day` / `every_n_days` / `none`), `day_of_month`
(1–31, for fixed_day), `interval_days` (for every_n_days), `next_date`, `planning_days` (for none,
default 30). Validation: amount > 0; exactly the field for the chosen schedule is set.

## categories

`name_vi`, `name_en`, `icon`, `kind` (`income`/`expense`), `monthly_limit` (nullable),
`is_default`, `sort_order`. Defaults are seeded per user from the existing `src/lib/categories.ts`.

## transactions

`kind` (`income`/`expense`), `amount` (bigint, minor units; VND has none), `currency`,
`category_id`, `occurred_at`, `note`, `source` (`manual`/`parser`/`assistant`/`bill`/`debt`/`goal`),
`ref_id` (nullable link to bill, debt payment or goal contribution). Validation: amount > 0.

## budgets

`month` (date, first day), `total_limit`. Category limits live on `categories.monthly_limit`.
Unique per (`user_id`, `month`).

## bills

`name`, `amount`, `currency`, `recurrence` (`weekly`/`monthly`/`yearly`/`every_n_days`),
`interval_days`, `next_due`, `remind_days_before` (default 2), `category_id`, `active`.
State: paying a bill creates a transaction (`source=bill`) and advances `next_due`.

## debts

`direction` (`i_owe`/`owed_to_me`), `counterparty`, `total`, `currency`, `installments` (nullable
int), `installment_amount`, `next_due`, `remind_days_before`, `status` (`open`/`settled`).

## debt_payments

`debt_id`, `amount`, `paid_at`. Remaining = `total − sum(payments)`; status becomes `settled` when
remaining ≤ 0. Each payment creates a transaction (`expense` for i_owe, `income` for owed_to_me).

## goals

`name`, `target`, `currency`, `deadline` (nullable), `is_emergency_fund`, `daily_target`
(nullable), `status` (`active`/`done`/`archived`).

## goal_contributions

`goal_id`, `amount`, `contributed_at`. Streak = consecutive days with a contribution to the
emergency fund goal. Money in active goals is excluded from safe-to-spend.

## assistant_messages (local only in v1)

`role` (`user`/`assistant`), `text`, `mode` (`offline`/`byo_key`/`cloud`), `actions` (JSON list
of proposed actions, see `contracts/assistant-actions.md`, each with `status`
`proposed`/`confirmed`/`rejected`).

## ai_usage (server only)

`user_id`, `month`, `requests`. Written by the `assistant` Edge Function to enforce the Pro quota.

## Derived: safe-to-spend (not stored)

```
period_end   = next income date (or today + planning_days if no fixed income)
days_left    = max(1, days from today to period_end, inclusive of today)
available    = current balance (sum of income − sum of expenses)
reserved     = unpaid bills and debt installments due on or before period_end
set_aside    = sum of contributions to active goals
spent_today  = today's expenses
pool         = available − reserved − set_aside + spent_today
daily        = max(0, floor(pool / days_left))
left_today   = max(0, daily − spent_today)
shortfall    = max(0, −pool)
```

This matches spec US1 scenario 1: (3,000,000 − 1,000,000) / 10 = 200,000đ.
