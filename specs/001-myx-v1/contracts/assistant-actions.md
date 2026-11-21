# Contract: AI assistant

## Edge Function `assistant`

`POST /functions/v1/assistant` with the user's Supabase JWT.

Request:

```json
{
  "language": "vi",
  "message": "đặt ngân sách ăn uống 1.5 triệu",
  "history": [{ "role": "user", "text": "..." }, { "role": "assistant", "text": "..." }],
  "context": {
    "today": "2026-11-21",
    "currency": "VND",
    "safeToSpend": { "daily": 200000, "leftToday": 150000, "daysLeft": 10, "shortfall": 0 },
    "monthTotals": { "income": 4000000, "expense": 2100000 },
    "categories": [{ "id": "uuid", "name": "Ăn uống", "spent": 900000, "limit": 1500000 }],
    "recentTransactions": [{ "amount": 35000, "category": "Cà phê", "at": "2026-11-21T08:10" }]
  }
}
```

`context` is a summary built on the device (FR-025: minimum data, at most the last 50
transactions); no raw history dump.

Response `200`:

```json
{
  "reply": "Mình đề xuất đặt hạn mức Ăn uống là 1.500.000đ/tháng.",
  "actions": [{ "type": "set_category_limit", "params": { "categoryId": "uuid", "limit": 1500000 } }],
  "usage": { "used": 12, "limit": 300 }
}
```

Errors: `401` not signed in; `402` not Pro; `429` monthly quota reached; `503` provider down.
On any error the client falls back to the offline assistant and shows the reason (FR-023).

## Proposed actions

The server and the offline assistant both return actions in this shape. The client validates
`params`, renders a confirmation card, and executes only after the user taps Confirm (FR-022).

| `type` | `params` | Effect after confirm |
|---|---|---|
| `add_transaction` | `kind`, `amount`, `categoryId?`, `occurredAt?`, `note?` | insert transaction, `source=assistant` |
| `edit_transaction` | `id`, any of the fields above | update transaction |
| `set_monthly_budget` | `month`, `totalLimit` | upsert budget |
| `set_category_limit` | `categoryId`, `limit` | update category |
| `create_goal` | `name`, `target`, `deadline?`, `dailyTarget?` | insert goal |
| `add_bill` | `name`, `amount`, `recurrence`, `nextDue`, `remindDaysBefore?` | insert bill, schedule reminder |
| `add_debt` | `direction`, `counterparty`, `total`, `installments?`, `nextDue?` | insert debt |

Rules enforced on the server prompt and checked client-side before display:
- No action or reply may recommend loans, credit cards, BNPL, gambling or crypto (FR-024).
- Unknown `type` or invalid `params` → the card is not shown; the reply text is still shown.
