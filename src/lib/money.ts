/**
 * Pure money maths for MYX (no React, unit-tested in scripts/test-money.ts).
 * Formula: specs/001-myx-v1/data-model.md "Derived: safe-to-spend".
 */
import { AppData, Bill, Debt, Recurrence, Subscription, Transaction } from './types';

export const DAY = 86_400_000;

export function ymd(d: Date): string {
  const p = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
/** Whole days from today to a YYYY-MM-DD date (0 = today, negative = past). */
export function daysUntil(s: string, now = new Date()): number {
  if (!s) return Infinity;
  return Math.round((parseYmd(s).getTime() - startOfDay(now).getTime()) / DAY);
}
export function ddmm(s: string): string {
  return s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : '';
}
export function addRecurrence(s: string, r: Recurrence | 'm' | 'y'): string {
  const d = parseYmd(s);
  if (r === 'weekly') d.setDate(d.getDate() + 7);
  else if (r === 'monthly' || r === 'm') d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return ymd(d);
}

/** Balance per wallet: opening balance + income − expenses ± transfers. */
export function walletBalances(data: Pick<AppData, 'wallets' | 'transactions' | 'transfers'>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of data.wallets) out[w.id] = w.initial;
  const fallback = data.wallets[0]?.id;
  for (const t of data.transactions) {
    const id = out[t.walletId] !== undefined ? t.walletId : fallback;
    if (!id) continue;
    out[id] += t.type === 'income' ? t.amount : -t.amount;
  }
  for (const tr of data.transfers) {
    if (out[tr.from] !== undefined) out[tr.from] -= tr.amount;
    if (out[tr.to] !== undefined) out[tr.to] += tr.amount;
  }
  return out;
}
export function totalBalance(data: Pick<AppData, 'wallets' | 'transactions' | 'transfers'>): number {
  return Object.values(walletBalances(data)).reduce((a, b) => a + b, 0);
}

/** Next payday date and days left in the period (today counts as a day). */
export function period(payday: number, planningDays: number, now = new Date()): { end: Date; daysLeft: number; label: string } {
  const today = startOfDay(now);
  if (payday >= 1) {
    let end = new Date(today.getFullYear(), today.getMonth(), payday);
    if (end <= today) end = new Date(today.getFullYear(), today.getMonth() + 1, payday);
    const daysLeft = Math.max(1, Math.round((end.getTime() - today.getTime()) / DAY));
    return { end, daysLeft, label: ymd(end) };
  }
  const n = Math.max(1, planningDays || 30);
  const end = new Date(today.getTime() + n * DAY);
  const left = Math.max(1, Math.round((new Date(today.getFullYear(), today.getMonth() + 1, 1).getTime() - today.getTime()) / DAY));
  return { end, daysLeft: Math.min(n, left), label: ymd(end) };
}

export interface DueItem {
  kind: 'bill' | 'sub' | 'debt';
  id: string;
  name: string;
  amount: number;
  due: string;
  days: number;
}

/** Bills, subscriptions and debt installments due from today up to (not including) the period end. */
export function dueBefore(data: Pick<AppData, 'bills' | 'subs' | 'debts'>, endDays: number, now = new Date()): DueItem[] {
  const out: DueItem[] = [];
  for (const b of data.bills) {
    const d = daysUntil(b.nextDue, now);
    if (b.active && d >= 0 && d < endDays) out.push({ kind: 'bill', id: b.id, name: b.name, amount: b.amount, due: b.nextDue, days: d });
  }
  for (const s of data.subs) {
    const d = daysUntil(s.nextRenew, now);
    if (d >= 0 && d < endDays) out.push({ kind: 'sub', id: s.id, name: s.name, amount: s.price, due: s.nextRenew, days: d });
  }
  for (const x of data.debts) {
    if (x.direction !== 'i_owe' || x.paid >= x.total || !x.nextDue) continue;
    const d = daysUntil(x.nextDue, now);
    if (d >= 0 && d < endDays) out.push({ kind: 'debt', id: x.id, name: x.counterparty, amount: installmentAmount(x), due: x.nextDue, days: d });
  }
  return out.sort((a, b) => a.days - b.days);
}

export function installmentAmount(d: Debt): number {
  const left = Math.max(0, d.total - d.paid);
  if (!d.installments) return left;
  const per = Math.round(d.total / d.installments);
  return Math.min(per, left);
}

export function spentOn(txs: Transaction[], day: Date): number {
  const a = startOfDay(day).getTime();
  const b = a + DAY;
  return txs.reduce((s, t) => {
    const x = new Date(t.date).getTime();
    return t.type === 'expense' && x >= a && x < b ? s + t.amount : s;
  }, 0);
}

export interface SafeToSpend {
  balance: number;
  reserved: number;
  setAside: number;
  spentToday: number;
  daysLeft: number;
  daily: number;
  leftToday: number;
  shortfall: number;
  periodEnd: string;
  due: DueItem[];
}

export function safeToSpend(data: AppData, now = new Date(), extraSpend = 0): SafeToSpend {
  const p = period(data.settings.payday, data.settings.planningDays, now);
  const balance = totalBalance(data) - extraSpend;
  const due = dueBefore(data, p.daysLeft, now);
  const reserved = due.reduce((s, d) => s + d.amount, 0);
  const setAside = data.goals.reduce((s, g) => s + g.saved, 0);
  const spentToday = spentOn(data.transactions, now);
  const pool = balance - reserved - setAside + spentToday;
  const daily = Math.max(0, Math.floor(pool / p.daysLeft / 500) * 500);
  return {
    balance,
    reserved,
    setAside,
    spentToday,
    daysLeft: p.daysLeft,
    daily,
    leftToday: Math.max(0, daily - spentToday),
    shortfall: Math.max(0, -pool),
    periodEnd: p.label,
    due,
  };
}

/** "Can I afford it?": new daily amount after buying now, and weeks of saving if it does not fit. */
export function affordability(data: AppData, price: number, now = new Date()) {
  const before = safeToSpend(data, now);
  const after = safeToSpend(data, now, price);
  const fits = after.shortfall === 0 && after.daily > 0;
  const perWeek = Math.max(1, Math.round(before.daily * 0.2) * 7);
  return { before, after, fits, weeksToSave: Math.ceil(price / perWeek), perWeek };
}

export function subMonthly(s: Subscription): number {
  return s.cycle === 'y' ? Math.round(s.price / 12) : s.price;
}
export function subsAudit(subs: Subscription[]) {
  const monthly = subs.reduce((a, s) => a + subMonthly(s), 0);
  return { monthly, yearly: monthly * 12, list: [...subs].sort((a, b) => subMonthly(b) - subMonthly(a)) };
}

/** Consecutive saved days ending today or yesterday. */
export function streak(days: string[], now = new Date()): number {
  const set = new Set(days);
  let d = startOfDay(now);
  if (!set.has(ymd(d))) d = new Date(d.getTime() - DAY);
  let n = 0;
  while (set.has(ymd(d))) {
    n++;
    d = new Date(d.getTime() - DAY);
  }
  return n;
}

/** Next due date after paying a bill. */
export function nextBillDue(b: Bill): string {
  return addRecurrence(b.nextDue, b.recurrence);
}

/** Spending per day for the last n days (oldest first), ending today. */
export function dailySeries(txs: Transaction[], n: number, now = new Date()): { date: Date; value: number }[] {
  const out: { date: Date; value: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(startOfDay(now).getTime() - i * DAY);
    out.push({ date: d, value: spentOn(txs, d) });
  }
  return out;
}

/** Monday-based week days (Mon..Sun) of the current week with spending; future days are null. */
export function weekBars(txs: Transaction[], now = new Date()): (number | null)[] {
  const today = startOfDay(now);
  const mon = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon.getTime() + i * DAY);
    return d > today ? null : spentOn(txs, d);
  });
}
export function weekTotal(txs: Transaction[], weeksBack: number, now = new Date()): number {
  const today = startOfDay(now);
  const mon = new Date(today.getTime() - ((today.getDay() + 6) % 7) * DAY - weeksBack * 7 * DAY);
  const end = weeksBack === 0 ? today.getTime() + DAY : mon.getTime() + 7 * DAY;
  return txs.reduce((s, t) => {
    const x = new Date(t.date).getTime();
    return t.type === 'expense' && x >= mon.getTime() && x < end ? s + t.amount : s;
  }, 0);
}
/** Expense totals for the last n months (oldest first), current month included. */
export function monthBars(txs: Transaction[], n: number, now = new Date()): { y: number; m: number; value: number }[] {
  const out: { y: number; m: number; value: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const value = txs.reduce((s, t) => {
      const x = new Date(t.date);
      return t.type === 'expense' && x.getFullYear() === y && x.getMonth() === m ? s + t.amount : s;
    }, 0);
    out.push({ y, m, value });
  }
  return out;
}
