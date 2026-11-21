import { daysInMonth, sameMonth, vnd } from './format';
import { Category, Lang, Transaction } from './types';

const tr = (lang: Lang, vi: string, en: string) => (lang === 'en' ? en : vi);
const money = (lang: Lang, n: number) => (lang === 'en' ? vnd(n).replace(/\./g, ',').replace('đ', '₫') : vnd(n));
const cname = (c: Category, lang: Lang) => (lang === 'en' ? c.nameEn : c.name);

export interface CategoryStat {
  category: Category;
  spent: number;
  limit: number;
  pct: number; // 0..n (can exceed 1)
  forecast: number; // projected spend at end of month
  status: 'ok' | 'warn' | 'over';
  note?: string;
}

export interface MonthStats {
  year: number;
  month: number;
  income: number;
  expense: number;
  budget: number; // sum of category limits
  remaining: number;
  daysElapsed: number;
  daysTotal: number;
  avgPerDay: number;
  forecast: number;
  safePerDay: number; // how much can still be spent per remaining day
  categories: CategoryStat[];
  txs: Transaction[];
}

/** Categories paid once a month (rent, bills): never extrapolated linearly. */
export const FIXED_CATEGORIES = new Set(['hd']);

export function txInMonth(txs: Transaction[], y: number, m: number): Transaction[] {
  return txs.filter((t) => sameMonth(new Date(t.date), y, m));
}

export function monthStats(
  txs: Transaction[],
  categories: Category[],
  y: number,
  m: number,
  now = new Date(),
  lang: Lang = 'vi',
): MonthStats {
  const list = txInMonth(txs, y, m);
  const daysTotal = daysInMonth(y, m);
  const isCurrent = now.getFullYear() === y && now.getMonth() === m;
  const isPast = new Date(y, m + 1, 1) <= now;
  const daysElapsed = isCurrent ? now.getDate() : isPast ? daysTotal : 0;

  let income = 0;
  let expense = 0;
  const byCat: Record<string, number> = {};
  for (const t of list) {
    if (t.type === 'income') income += t.amount;
    else {
      expense += t.amount;
      byCat[t.categoryId] = (byCat[t.categoryId] ?? 0) + t.amount;
    }
  }
  const expenseCats = categories.filter((c) => c.type === 'expense');
  const budget = expenseCats.reduce((s, c) => s + c.limit, 0);
  const ratio = daysElapsed > 0 ? daysTotal / daysElapsed : 1;

  const cats: CategoryStat[] = expenseCats.map((c) => {
    const spent = byCat[c.id] ?? 0;
    const pct = c.limit > 0 ? spent / c.limit : 0;
    const fixed = FIXED_CATEGORIES.has(c.id);
    const forecast = isCurrent && !fixed ? Math.round(spent * ratio) : spent;
    let status: CategoryStat['status'] = 'ok';
    let note: string | undefined;
    if (c.limit > 0) {
      if (spent > c.limit) {
        status = 'over';
        note = tr(lang, `Đã vượt ${money(lang, spent - c.limit)}`, `Over by ${money(lang, spent - c.limit)}`);
      } else if (isCurrent && forecast > c.limit && spent > 0) {
        status = 'warn';
        const perDay = spent / Math.max(daysElapsed, 1);
        const day = Math.min(daysTotal, Math.ceil(c.limit / perDay));
        note = tr(lang, `Dự báo vượt hạn mức vào khoảng ngày ${day}`, `Likely over the limit around day ${day}`);
      } else if (pct >= 0.8 && !fixed) {
        status = 'warn';
        note = tr(lang, `Đã dùng ${Math.round(pct * 100)}% hạn mức`, `${Math.round(pct * 100)}% of the limit used`);
      }
    }
    return { category: c, spent, limit: c.limit, pct, forecast, status, note };
  });

  const fixedSpent = cats.filter((c) => FIXED_CATEGORIES.has(c.category.id)).reduce((a, c) => a + c.spent, 0);
  const forecast = isCurrent ? Math.round((expense - fixedSpent) * ratio) + fixedSpent : expense;
  const remainingDays = Math.max(daysTotal - daysElapsed + (isCurrent ? 1 : 0), 1);
  const remaining = budget - expense;

  return {
    year: y,
    month: m,
    income,
    expense,
    budget,
    remaining,
    daysElapsed,
    daysTotal,
    avgPerDay: daysElapsed > 0 ? Math.round(expense / daysElapsed) : 0,
    forecast,
    safePerDay: remaining > 0 ? Math.floor(remaining / remainingDays) : 0,
    categories: cats.sort((a, b) => b.spent - a.spent),
    txs: list,
  };
}

/** Spending per category in a date window [from, to). */
export function spendBetween(txs: Transaction[], from: Date, to: Date, categoryId?: string): number {
  return txs
    .filter((t) => {
      const d = new Date(t.date);
      return t.type === 'expense' && d >= from && d < to && (!categoryId || t.categoryId === categoryId);
    })
    .reduce((s, t) => s + t.amount, 0);
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - day);
  return x;
}

export interface Insight {
  tone: 'warn' | 'info' | 'good';
  title: string;
  text: string;
}

/** Short, rule-based observations for the home card. Most important first. */
export function buildInsights(txs: Transaction[], categories: Category[], now = new Date(), lang: Lang = 'vi'): Insight[] {
  const out: Insight[] = [];
  const s = monthStats(txs, categories, now.getFullYear(), now.getMonth(), now, lang);
  if (s.txs.length === 0) {
    return [{ tone: 'info', title: tr(lang, 'Bắt đầu thôi', "Let's start"), text: tr(lang, 'Chưa có giao dịch nào tháng này. Bấm nút + rồi gõ kiểu "cafe 35k, grab 40k" để AI ghi giúp bạn.', 'No transactions this month yet. Tap + and type something like "coffee 35k, bus 7k".') }];
  }

  const over = s.categories.filter((c) => c.status === 'over');
  const warn = s.categories.filter((c) => c.status === 'warn');
  for (const c of over.slice(0, 1)) {
    out.push({ tone: 'warn', title: tr(lang, `${c.category.name} đã vượt hạn mức`, `${c.category.nameEn} is over its limit`), text: tr(lang, `Bạn đã chi ${money(lang, c.spent)} trên hạn mức ${money(lang, c.limit)}. Cân nhắc giảm mục này trong những ngày còn lại.`, `You spent ${money(lang, c.spent)} of a ${money(lang, c.limit)} limit. Try to cut back here for the rest of the month.`) });
  }
  for (const c of warn.slice(0, 1)) {
    out.push({ tone: 'warn', title: tr(lang, `Để ý mục ${c.category.name}`, `Watch ${c.category.nameEn}`), text: tr(lang, `${c.note}. Hiện đã chi ${money(lang, c.spent)} / ${money(lang, c.limit)}.`, `${c.note}. Spent ${money(lang, c.spent)} of ${money(lang, c.limit)}.`) });
  }

  // Week over week change for the biggest category
  const thisWeek = startOfWeek(now);
  const lastWeek = new Date(thisWeek);
  lastWeek.setDate(thisWeek.getDate() - 7);
  const daysIntoWeek = Math.max(1, Math.round((now.getTime() - thisWeek.getTime()) / 86400000) + 1);
  const lastWeekSameSpan = new Date(lastWeek);
  lastWeekSameSpan.setDate(lastWeek.getDate() + daysIntoWeek);
  for (const c of s.categories.slice(0, 3)) {
    const a = spendBetween(txs, thisWeek, new Date(now.getTime() + 1), c.category.id);
    const b = spendBetween(txs, lastWeek, lastWeekSameSpan, c.category.id);
    if (b > 0 && a > b * 1.3 && a - b > 50_000) {
      out.push({ tone: 'info', title: tr(lang, `${c.category.name} tăng mạnh`, `${c.category.nameEn} is up`), text: tr(lang, `Tuần này bạn chi ${money(lang, a)} cho ${c.category.name.toLowerCase()}, cao hơn ${Math.round((a / b - 1) * 100)}% so với cùng kỳ tuần trước.`, `You spent ${money(lang, a)} on ${c.category.nameEn.toLowerCase()} this week, ${Math.round((a / b - 1) * 100)}% more than the same days last week.`) });
      break;
    }
  }

  if (s.budget > 0) {
    if (s.forecast > s.budget) {
      out.push({ tone: 'warn', title: tr(lang, 'Dự báo cuối tháng', 'Month-end forecast'), text: tr(lang, `Với nhịp chi hiện tại, cuối tháng bạn sẽ tiêu khoảng ${money(lang, s.forecast)}, vượt ngân sách ${money(lang, s.forecast - s.budget)}.`, `At this pace you'll spend about ${money(lang, s.forecast)} this month, ${money(lang, s.forecast - s.budget)} over budget.`) });
    } else if (out.length === 0) {
      out.push({ tone: 'good', title: tr(lang, 'Đang đi đúng hướng', 'On track'), text: tr(lang, `Dự báo cuối tháng bạn tiêu khoảng ${money(lang, s.forecast)}, vẫn trong ngân sách ${money(lang, s.budget)}.`, `You're on course to spend about ${money(lang, s.forecast)}, within your ${money(lang, s.budget)} budget.`) });
    }
  }
  return out;
}
