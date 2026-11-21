/* Run with: npx tsx scripts/test-money.ts — checks spec US1 scenarios and US14 affordability. */
import { DEFAULT_CATEGORIES } from '../src/lib/categories';
import { affordability, safeToSpend, streak, ymd } from '../src/lib/money';
import { AppData } from '../src/lib/types';

const now = new Date(2026, 10, 21, 10, 0); // Sat 21 Nov 2026
let fail = 0;
const eq = (name: string, a: unknown, b: unknown) => {
  const ok = a === b;
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  got ${a}, want ${b}`}`);
};

function base(): AppData {
  return {
    version: 2,
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    wallets: [{ id: 'w1', name: 'Tiền mặt', type: 'cash', initial: 3_000_000 }],
    transfers: [],
    bills: [{ id: 'b1', name: 'Tiền phòng', amount: 1_000_000, recurrence: 'monthly', nextDue: '2026-11-25', remindDays: 2, categoryId: 'hd', active: true }],
    debts: [],
    subs: [],
    goals: [],
    jars: [],
    templates: [],
    notes: {},
    rules: {},
    settings: {
      userName: '', geminiKey: '', geminiModel: '', lang: 'vi', appearance: 'system', theme: 'leaf', hideAmounts: false,
      lock: false, lockDelay: 0, payday: 1, planningDays: 30, recap: false, recapHour: 21, weekly: false, onboarded: true, pro: false,
    },
  };
}

// US1-1: 3,000,000 balance, payday in 10 days (Dec 1), 1,000,000 bills -> 200,000 per day
const d = base();
eq('US1-1 daysLeft', safeToSpend(d, now).daysLeft, 10);
eq('US1-1 daily', safeToSpend(d, now).daily, 200_000);

// US1-2: log 50,000 today -> 150,000 left today
d.transactions.push({ id: 't1', amount: 50_000, type: 'expense', categoryId: 'an', walletId: 'w1', note: '', date: now.toISOString(), createdAt: now.toISOString() });
eq('US1-2 leftToday', safeToSpend(d, now).leftToday, 150_000);
eq('US1-2 daily unchanged within the day', safeToSpend(d, now).daily, 200_000);

// US1-3: next day after spending only 50k: allowance grows
const tomorrow = new Date(2026, 10, 22, 9, 0);
eq('US1-3 daily grows', safeToSpend(d, tomorrow).daily > 200_000, true);

// US1-4: shortfall never gives a negative daily amount
const s = base();
s.wallets[0].initial = 500_000;
eq('US1-4 daily is 0', safeToSpend(s, now).daily, 0);
eq('US1-4 shortfall', safeToSpend(s, now).shortfall, 500_000);

// US14-1: 203,500/day, 10 days, buy 500,000 now -> 153,500
const a = base();
a.wallets[0].initial = 3_035_000;
a.bills = [];
a.goals = [{ id: 'g', name: 'Quỹ', target: 0, saved: 0, emergency: true, dailyTarget: 0, days: [] }];
const r = affordability(a, 500_000, now);
eq('US14-1 before', r.before.daily, 303_500);
eq('US14-1 after', r.after.daily, 253_500);

// streak
eq('streak', streak([ymd(new Date(2026, 10, 19)), ymd(new Date(2026, 10, 20)), ymd(now)], now), 3);

console.log(fail ? `\n${fail} failed` : '\nAll money tests passed');
if (fail) process.exit(1);
