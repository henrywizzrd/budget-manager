export type TxType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  short: string; // 2-letter badge
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
  note: string;
  date: string; // ISO string
  createdAt: string;
  source?: 'manual' | 'ai' | 'gemini' | 'sample';
}

export interface Settings {
  userName: string;
  geminiKey: string;
  geminiModel: string;
}

export interface AppData {
  version: 1;
  categories: Category[];
  transactions: Transaction[];
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  bars?: { label: string; value: number; display: string }[];
}
