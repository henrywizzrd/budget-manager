export type TxType = 'expense' | 'income';
export type Lang = 'vi' | 'en';

export interface Category {
  id: string;
  name: string; // Vietnamese
  nameEn: string;
  short: string; // legacy 2-letter badge (kept for old data)
  icon: string; // id in the MYX icon set (design/icons)
  color: string; // tile colour
  fg: string;
  bg: string;
  type: TxType;
  /** Monthly limit in VND. 0 = no limit. Only meaningful for expense categories. */
  limit: number;
}

export interface Transaction {
  id: string;
  amount: number; // always positive, VND
  type: TxType;
  categoryId: string;
  walletId: string;
  note: string;
  date: string; // ISO string
  createdAt: string;
  source?: 'manual' | 'ai' | 'gemini' | 'sample' | 'bill' | 'debt' | 'sub' | 'template';
}

export type WalletType = 'cash' | 'bank' | 'ewallet' | 'other';
export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initial: number; // opening balance
}

export interface Transfer {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
}

export type Recurrence = 'weekly' | 'monthly' | 'yearly';
export interface Bill {
  id: string;
  name: string;
  amount: number;
  recurrence: Recurrence;
  nextDue: string; // YYYY-MM-DD
  remindDays: number;
  categoryId: string;
  active: boolean;
}

export interface Debt {
  id: string;
  direction: 'i_owe' | 'owed_to_me';
  counterparty: string;
  total: number;
  installments: number; // 0 = single payment
  nextDue: string; // YYYY-MM-DD or ''
  paid: number; // sum of payments
  paidCount: number;
  note: string;
}

export type SubType = 'sub_ai' | 'sub_music' | 'sub_video' | 'sub_cloud' | 'sub_game' | 'sub_app';
export interface Subscription {
  id: string;
  name: string;
  type: SubType;
  price: number;
  cycle: 'm' | 'y';
  nextRenew: string; // YYYY-MM-DD
  remindDays: 1 | 3 | 7;
  remind: boolean;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  emergency: boolean;
  dailyTarget: number;
  /** YYYY-MM-DD dates on which the user saved (emergency fund streak). */
  days: string[];
}

export interface Jar {
  id: string;
  name: string;
  pct: number;
}

export interface Template {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
}

export interface Settings {
  userName: string;
  geminiKey: string;
  geminiModel: string;
  lang: Lang;
  appearance: 'light' | 'dark' | 'system';
  theme: string;
  hideAmounts: boolean;
  lock: boolean;
  lockDelay: number; // seconds
  payday: number; // day of month 1-31, 0 = no fixed payday
  planningDays: number; // used when payday = 0
  recap: boolean;
  recapHour: number;
  weekly: boolean;
  onboarded: boolean;
  pro: boolean; // prototype flag, no real purchase yet
}

export interface AppData {
  version: 2;
  categories: Category[];
  transactions: Transaction[];
  wallets: Wallet[];
  transfers: Transfer[];
  bills: Bill[];
  debts: Debt[];
  subs: Subscription[];
  goals: Goal[];
  jars: Jar[];
  templates: Template[];
  notes: Record<string, string>; // YYYY-MM-DD -> one-line note
  rules: Record<string, string>; // learned word -> categoryId
  settings: Settings;
}

/** A transaction proposed by the parser, before the user saves it. */
export interface DraftTx {
  key: string;
  amount: number;
  type: TxType;
  categoryId: string;
  note: string;
  dayOffset: number; // 0 = today, -1 = yesterday...
  timeLabel: string; // "Trưa nay", "Hôm qua"...
}

export type ActionProposal =
  | { type: 'set_category_limit'; categoryId: string; limit: number }
  | { type: 'add_transactions'; items: DraftTx[] }
  | { type: 'create_goal'; name: string; target: number };

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  bars?: { label: string; value: number; display: string }[];
  action?: ActionProposal;
  actionState?: 'proposed' | 'confirmed' | 'rejected';
}
