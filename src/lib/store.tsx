import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_CATEGORIES } from './categories';
import { fold, uid } from './format';
import { DEFAULT_GEMINI_MODEL } from './gemini';
import { addRecurrence, installmentAmount, nextBillDue, ymd } from './money';
import { makeSampleData } from './sample';
import {
  AppData, Bill, Category, Debt, DraftTx, Goal, Jar, Settings, Subscription, Template, Transaction, Wallet,
} from './types';

const KEY = 'myx/data/v2';
const LEGACY_KEY = 'budget-manager/data/v1';

export const DEFAULT_SETTINGS: Settings = {
  userName: '',
  geminiKey: '',
  geminiModel: DEFAULT_GEMINI_MODEL,
  lang: 'vi',
  appearance: 'system',
  theme: 'leaf',
  hideAmounts: false,
  lock: false,
  lockDelay: 30,
  payday: 1,
  planningDays: 30,
  recap: true,
  recapHour: 21,
  weekly: true,
  onboarded: false,
  pro: false,
};

const DEFAULT_JARS: Jar[] = [
  { id: 'j1', name: 'Ăn uống', pct: 50 },
  { id: 'j2', name: 'Học tập', pct: 10 },
  { id: 'j3', name: 'Tiết kiệm', pct: 10 },
  { id: 'j4', name: 'Hưởng thụ', pct: 10 },
  { id: 'j5', name: 'Khẩn cấp', pct: 10 },
  { id: 'j6', name: 'Cho đi', pct: 10 },
];

function empty(lang: Settings['lang'] = 'vi'): AppData {
  return {
    version: 2,
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    wallets: [{ id: 'cash', name: lang === 'vi' ? 'Tiền mặt' : 'Cash', type: 'cash', initial: 0 }],
    transfers: [],
    bills: [],
    debts: [],
    subs: [],
    goals: [{ id: 'ef', name: lang === 'vi' ? 'Quỹ khẩn cấp' : 'Emergency fund', target: 1_000_000, saved: 0, emergency: true, dailyTarget: 10_000, days: [] }],
    jars: DEFAULT_JARS,
    templates: [],
    notes: {},
    rules: {},
    settings: { ...DEFAULT_SETTINGS, lang },
  };
}

function mergeCategories(saved?: Category[]): Category[] {
  return DEFAULT_CATEGORIES.map((d) => {
    const s = saved?.find((c) => c.id === d.id);
    return s ? { ...d, limit: s.limit } : d;
  });
}

/** v1 (budget-manager) -> v2 (MYX): keep categories' limits, transactions and settings; everything else starts empty. */
function migrate(raw: any): AppData {
  const base = empty(raw?.settings?.lang ?? 'vi');
  if (raw?.version === 2) {
    return {
      ...base,
      ...raw,
      categories: mergeCategories(raw.categories),
      settings: { ...base.settings, ...raw.settings },
    };
  }
  const txs: Transaction[] = (raw?.transactions ?? []).map((t: any) => ({ ...t, walletId: 'cash' }));
  return {
    ...base,
    categories: mergeCategories(raw?.categories),
    transactions: txs,
    settings: { ...base.settings, ...(raw?.settings ?? {}), onboarded: txs.length > 0 },
  };
}

function sortTx(list: Transaction[]) {
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

/** Words used to learn categories from user corrections (FR-052). */
export function ruleKey(note: string): string {
  return fold(note).replace(/[^a-z ]/g, ' ').trim().split(/\s+/).slice(0, 2).join(' ');
}

interface Store {
  data: AppData;
  ready: boolean;
  set: (fn: (d: AppData) => AppData) => void;
  addDrafts: (drafts: DraftTx[], source: Transaction['source'], walletId?: string) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  setCategoryLimit: (id: string, limit: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setNote: (text: string) => void;
  learn: (note: string, categoryId: string) => void;
  upsertWallet: (w: Wallet) => void;
  removeWallet: (id: string) => void;
  transfer: (from: string, to: string, amount: number) => void;
  upsertBill: (b: Bill) => void;
  payBill: (id: string) => void;
  removeBill: (id: string) => void;
  upsertSub: (s: Subscription) => void;
  removeSub: (id: string) => void;
  upsertDebt: (d: Debt) => void;
  payDebt: (id: string) => void;
  removeDebt: (id: string) => void;
  upsertGoal: (g: Goal) => void;
  contribute: (goalId: string, amount: number) => void;
  removeGoal: (id: string) => void;
  setJars: (jars: Jar[]) => void;
  upsertTemplate: (t: Template) => void;
  removeTemplate: (id: string) => void;
  loadSample: () => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => empty());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = (await AsyncStorage.getItem(KEY)) ?? (await AsyncStorage.getItem(LEGACY_KEY));
        if (raw) setData(migrate(JSON.parse(raw)));
      } catch {
        // corrupted storage: start fresh rather than crash
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const set = useCallback((fn: (d: AppData) => AppData) => setData(fn), []);
  const wallet0 = (d: AppData) => d.wallets[0]?.id ?? 'cash';

  const addDrafts = useCallback((drafts: DraftTx[], source: Transaction['source'], walletId?: string) => {
    const now = new Date();
    setData((s) => {
      const items: Transaction[] = drafts.map((d) => {
        const date = new Date(now);
        date.setDate(now.getDate() + d.dayOffset);
        const label = d.timeLabel.toLowerCase();
        const hour = label.startsWith('sáng') ? 8 : label.startsWith('trưa') ? 12 : label.startsWith('chiều') ? 16 : label.startsWith('tối') ? 19 : null;
        if (hour !== null) {
          date.setHours(hour, 0, 0, 0);
          if (date > now) date.setTime(now.getTime());
        }
        return {
          id: uid(), amount: d.amount, type: d.type, categoryId: d.categoryId, walletId: walletId ?? wallet0(s),
          note: d.note, date: date.toISOString(), createdAt: now.toISOString(), source,
        };
      });
      return { ...s, transactions: sortTx([...items, ...s.transactions]) };
    });
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    setData((s) => ({ ...s, transactions: sortTx([{ ...t, id: uid(), createdAt: new Date().toISOString() }, ...s.transactions]) }));
  }, []);

  const deleteTransaction = useCallback((id: string) => setData((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) })), []);
  const setCategoryLimit = useCallback((id: string, limit: number) => setData((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, limit } : c)) })), []);
  const updateSettings = useCallback((patch: Partial<Settings>) => setData((s) => ({ ...s, settings: { ...s.settings, ...patch } })), []);
  const setNote = useCallback((text: string) => setData((s) => ({ ...s, notes: { ...s.notes, [ymd(new Date())]: text.slice(0, 80) } })), []);
  const learn = useCallback((note: string, categoryId: string) => {
    const k = ruleKey(note);
    if (k) setData((s) => ({ ...s, rules: { ...s.rules, [k]: categoryId } }));
  }, []);

  const upsert = <T extends { id: string }>(list: T[], item: T) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);

  const upsertWallet = useCallback((w: Wallet) => setData((s) => ({ ...s, wallets: upsert(s.wallets, w) })), []);
  const removeWallet = useCallback((id: string) => setData((s) => (s.wallets.length <= 1 ? s : { ...s, wallets: s.wallets.filter((w) => w.id !== id), transactions: s.transactions.map((t) => (t.walletId === id ? { ...t, walletId: s.wallets.find((w) => w.id !== id)!.id } : t)) })), []);
  const transfer = useCallback((from: string, to: string, amount: number) => setData((s) => ({ ...s, transfers: [...s.transfers, { id: uid(), from, to, amount, date: new Date().toISOString() }] })), []);

  const upsertBill = useCallback((b: Bill) => setData((s) => ({ ...s, bills: upsert(s.bills, b) })), []);
  const removeBill = useCallback((id: string) => setData((s) => ({ ...s, bills: s.bills.filter((b) => b.id !== id) })), []);
  const payBill = useCallback((id: string) => {
    setData((s) => {
      const b = s.bills.find((x) => x.id === id);
      if (!b) return s;
      const now = new Date();
      const tx: Transaction = { id: uid(), amount: b.amount, type: 'expense', categoryId: b.categoryId, walletId: wallet0(s), note: b.name, date: now.toISOString(), createdAt: now.toISOString(), source: 'bill' };
      return { ...s, bills: s.bills.map((x) => (x.id === id ? { ...x, nextDue: nextBillDue(x) } : x)), transactions: sortTx([tx, ...s.transactions]) };
    });
  }, []);

  const upsertSub = useCallback((x: Subscription) => setData((s) => ({ ...s, subs: upsert(s.subs, x) })), []);
  const removeSub = useCallback((id: string) => setData((s) => ({ ...s, subs: s.subs.filter((x) => x.id !== id) })), []);

  const upsertDebt = useCallback((d: Debt) => setData((s) => ({ ...s, debts: upsert(s.debts, d) })), []);
  const removeDebt = useCallback((id: string) => setData((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) })), []);
  const payDebt = useCallback((id: string) => {
    setData((s) => {
      const d = s.debts.find((x) => x.id === id);
      if (!d || d.paid >= d.total) return s;
      const amt = installmentAmount(d);
      const now = new Date();
      const income = d.direction === 'owed_to_me';
      const tx: Transaction = {
        id: uid(), amount: amt, type: income ? 'income' : 'expense', categoryId: income ? 'tn' : 'kh', walletId: wallet0(s),
        note: d.counterparty, date: now.toISOString(), createdAt: now.toISOString(), source: 'debt',
      };
      const paid = d.paid + amt;
      const next = d.installments && paid < d.total && d.nextDue ? addRecurrence(d.nextDue, 'monthly') : d.nextDue;
      return { ...s, debts: s.debts.map((x) => (x.id === id ? { ...x, paid, paidCount: x.paidCount + 1, nextDue: next } : x)), transactions: sortTx([tx, ...s.transactions]) };
    });
  }, []);

  const upsertGoal = useCallback((g: Goal) => setData((s) => ({ ...s, goals: upsert(s.goals, g) })), []);
  const removeGoal = useCallback((id: string) => setData((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })), []);
  const contribute = useCallback((goalId: string, amount: number) => {
    const today = ymd(new Date());
    setData((s) => ({
      ...s,
      goals: s.goals.map((g) => (g.id === goalId ? { ...g, saved: Math.max(0, g.saved + amount), days: amount > 0 && !g.days.includes(today) ? [...g.days, today] : g.days } : g)),
    }));
  }, []);

  const setJars = useCallback((jars: Jar[]) => setData((s) => ({ ...s, jars })), []);
  const upsertTemplate = useCallback((t: Template) => setData((s) => ({ ...s, templates: upsert(s.templates, t) })), []);
  const removeTemplate = useCallback((id: string) => setData((s) => ({ ...s, templates: s.templates.filter((t) => t.id !== id) })), []);

  const loadSample = useCallback(() => setData((s) => makeSampleData(s)), []);
  const resetAll = useCallback(() => setData((s) => ({ ...empty(s.settings.lang), settings: { ...s.settings } })), []);

  const value = useMemo<Store>(
    () => ({
      data, ready, set, addDrafts, addTransaction, deleteTransaction, setCategoryLimit, updateSettings, setNote, learn,
      upsertWallet, removeWallet, transfer, upsertBill, payBill, removeBill, upsertSub, removeSub, upsertDebt, payDebt, removeDebt,
      upsertGoal, contribute, removeGoal, setJars, upsertTemplate, removeTemplate, loadSample, resetAll,
    }),
    [data, ready, set, addDrafts, addTransaction, deleteTransaction, setCategoryLimit, updateSettings, setNote, learn, upsertWallet, removeWallet,
      transfer, upsertBill, payBill, removeBill, upsertSub, removeSub, upsertDebt, payDebt, removeDebt, upsertGoal, contribute, removeGoal, setJars,
      upsertTemplate, removeTemplate, loadSample, resetAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

export function useCategory(id: string) {
  const { data } = useStore();
  return data.categories.find((c) => c.id === id) ?? data.categories[data.categories.length - 2];
}
