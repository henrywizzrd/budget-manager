import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { DEFAULT_CATEGORIES } from './categories';
import { DEFAULT_GEMINI_MODEL } from './gemini';
import { uid } from './format';
import { makeSampleTransactions } from './sample';
import { AppData, DraftTx, Settings, Transaction } from './types';

const KEY = 'budget-manager/data/v1';

const EMPTY: AppData = {
  version: 1,
  categories: DEFAULT_CATEGORIES,
  transactions: [],
  settings: { userName: '', geminiKey: '', geminiModel: DEFAULT_GEMINI_MODEL },
};

interface Store {
  data: AppData;
  ready: boolean;
  addDrafts: (drafts: DraftTx[], source: Transaction['source']) => void;
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;
  setCategoryLimit: (id: string, limit: number) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  loadSample: () => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as AppData;
        // merge categories so new default categories appear after updates, keeping user limits
        const categories = DEFAULT_CATEGORIES.map((d) => {
          const s = saved.categories?.find((c) => c.id === d.id);
          return s ? { ...d, limit: s.limit } : d;
        });
        setData({ ...EMPTY, ...saved, categories, settings: { ...EMPTY.settings, ...saved.settings } });
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const addDrafts = useCallback((drafts: DraftTx[], source: Transaction['source']) => {
    const now = new Date();
    const items: Transaction[] = drafts.map((d) => {
      const date = new Date(now);
      date.setDate(now.getDate() + d.dayOffset);
      // "Trưa nay" -> 12:00, "Tối qua" -> 19:00... but never in the future
      const label = d.timeLabel.toLowerCase();
      const hour = label.startsWith('sáng') ? 8 : label.startsWith('trưa') ? 12 : label.startsWith('chiều') ? 16 : label.startsWith('tối') ? 19 : null;
      if (hour !== null) {
        date.setHours(hour, 0, 0, 0);
        if (date > now) date.setTime(now.getTime());
      }
      return {
        id: uid(),
        amount: d.amount,
        type: d.type,
        categoryId: d.categoryId,
        note: d.note,
        date: date.toISOString(),
        createdAt: now.toISOString(),
        source,
      };
    });
    setData((s) => ({ ...s, transactions: [...items, ...s.transactions].sort((a, b) => b.date.localeCompare(a.date)) }));
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, 'id' | 'createdAt'>) => {
    const item: Transaction = { ...t, id: uid(), createdAt: new Date().toISOString() };
    setData((s) => ({ ...s, transactions: [item, ...s.transactions].sort((a, b) => b.date.localeCompare(a.date)) }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setData((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== id) }));
  }, []);

  const setCategoryLimit = useCallback((id: string, limit: number) => {
    setData((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, limit } : c)) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const loadSample = useCallback(() => {
    setData((s) => ({
      ...s,
      transactions: [...s.transactions.filter((t) => t.source !== 'sample'), ...makeSampleTransactions()].sort((a, b) =>
        b.date.localeCompare(a.date),
      ),
    }));
  }, []);

  const resetAll = useCallback(() => {
    setData((s) => ({ ...EMPTY, settings: s.settings }));
  }, []);

  const value = useMemo(
    () => ({ data, ready, addDrafts, addTransaction, deleteTransaction, setCategoryLimit, updateSettings, loadSample, resetAll }),
    [data, ready, addDrafts, addTransaction, deleteTransaction, setCategoryLimit, updateSettings, loadSample, resetAll],
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
  return data.categories.find((c) => c.id === id) ?? data.categories[data.categories.length - 1];
}
