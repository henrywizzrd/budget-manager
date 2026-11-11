/**
 * Offline Vietnamese expense parser.
 *
 * Turns free text like
 *   "trưa nay ăn bún bò 50k với Minh, chiều đổ xăng 80k, tối mua sách 120 nghìn"
 * into a list of draft transactions. No network, no API key.
 */
import { CATEGORY_KEYWORDS } from './categories';
import { fold } from './format';
import { DraftTx, TxType } from './types';

interface Money {
  value: number;
  hasUnit: boolean;
  start: number;
  end: number;
}

const UNIT_MULT: Record<string, number> = {
  k: 1_000, nghin: 1_000, ngan: 1_000, ng: 1_000,
  tr: 1_000_000, trieu: 1_000_000, cu: 1_000_000, m: 1_000_000,
  lit: 100_000, xi: 10_000, chuc: 10_000,
  d: 1, vnd: 1, dong: 1,
};

// Works on FOLDED text (no diacritics), so units are ascii.
// number [.,digits]* ; optional space ; optional unit ; optional trailing digits ("1tr5", "2k5")
const MONEY_RE =
  /(^|[^a-z0-9])(\d+(?:[.,]\d+)*)\s*(nghin|ngan|trieu|vnd|dong|chuc|lit|xi|cu|tr|ng|k|m|d)?(\d{1,3})?(?![a-z0-9])/g;

function toNumber(raw: string, unit: string | undefined, tail: string | undefined): number {
  const mult = unit ? UNIT_MULT[unit] : 0;
  let base: number;
  const parts = raw.split(/[.,]/);
  if (parts.length === 1) {
    base = parseInt(raw, 10);
  } else if (mult >= 1000 && parts.length === 2 && parts[1].length <= 2) {
    // "1,5tr" / "2.5k" -> decimal
    base = parseFloat(`${parts[0]}.${parts[1]}`);
  } else {
    // "50.000" / "1,200,000" -> thousands separators
    base = parseInt(parts.join(''), 10);
  }

  if (mult) {
    let v = base * mult;
    if (tail && mult >= 1000) {
      // "1tr5" = 1.5tr, "1tr25" = 1.25tr, "2k5" = 2.5k
      v += parseFloat(`0.${tail}`) * mult;
    }
    return Math.round(v);
  }
  // No unit: short numbers mean thousands ("cafe 35" = 35.000đ)
  return base < 1000 ? base * 1000 : base;
}

function findMoney(folded: string): Money[] {
  const out: Money[] = [];
  MONEY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = MONEY_RE.exec(folded))) {
    const lead = m[1] ?? '';
    const start = m.index + lead.length;
    const end = m.index + m[0].length;
    const value = toNumber(m[2], m[3], m[4]);
    if (value > 0) out.push({ value, hasUnit: !!m[3], start, end });
  }
  // Prefer amounts with a unit: "2 ly cafe 60k" -> ignore the "2".
  if (out.some((x) => x.hasUnit)) return out.filter((x) => x.hasUnit);
  return out;
}

const TIME_WORDS: { re: RegExp; offset: number; label: string }[] = [
  { re: /\bhom kia\b/, offset: -2, label: 'Hôm kia' },
  { re: /\bhom qua\b/, offset: -1, label: 'Hôm qua' },
  { re: /\btoi qua\b/, offset: -1, label: 'Tối qua' },
  { re: /\bsang nay\b/, offset: 0, label: 'Sáng nay' },
  { re: /\btrua nay\b/, offset: 0, label: 'Trưa nay' },
  { re: /\bchieu nay\b/, offset: 0, label: 'Chiều nay' },
  { re: /\btoi nay\b/, offset: 0, label: 'Tối nay' },
  { re: /\bhom nay\b/, offset: 0, label: 'Hôm nay' },
  { re: /\bsang\b/, offset: 0, label: 'Sáng nay' },
  { re: /\btrua\b/, offset: 0, label: 'Trưa nay' },
  { re: /\bchieu\b/, offset: 0, label: 'Chiều nay' },
  { re: /\btoi\b/, offset: 0, label: 'Tối nay' },
];

// Words removed from the note (folded form).
const FILLER = [
  'hom kia', 'hom qua', 'toi qua', 'sang nay', 'trua nay', 'chieu nay', 'toi nay', 'hom nay',
  'het', 'mat', 'ton', 'chi', 'khoang', 'tam', 'roi', 'nua', 'la', 'nhe',
];

function detectCategory(folded: string): { categoryId: string; type: TxType } {
  const padded = ` ${folded.replace(/[^a-z0-9]+/g, ' ')} `;
  let best: { id: string; len: number } | null = null;
  for (const [id, words] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const w of words) {
      if (padded.includes(` ${w} `)) {
        // longer keyword = more specific; income keywords get a boost so "nhận lương" never becomes food
        const score = w.length + (id === 'tn' ? 3 : 0);
        if (!best || score > best.len) best = { id, len: score };
      }
    }
  }
  if (!best) return { categoryId: 'kh', type: 'expense' };
  return { categoryId: best.id, type: best.id === 'tn' ? 'income' : 'expense' };
}

function detectTime(folded: string): { offset: number; label: string } | null {
  for (const t of TIME_WORDS) if (t.re.test(folded)) return { offset: t.offset, label: t.label };
  return null;
}

/** Build a readable note from the ORIGINAL text, removing money, time and filler words. */
function buildNote(original: string, money: Money | undefined): string {
  let text = original;
  if (money) text = text.slice(0, money.start) + ' ' + text.slice(money.end);
  // Work word-by-word so diacritics in the original are preserved.
  const words = text.split(/\s+/).filter(Boolean);
  const foldedWords = words.map((w) => fold(w).replace(/[^a-z0-9]/g, ''));
  const keep: boolean[] = words.map(() => true);
  for (const f of FILLER) {
    const fw = f.split(' ');
    for (let i = 0; i + fw.length <= foldedWords.length; i++) {
      if (fw.every((x, j) => foldedWords[i + j] === x)) for (let j = 0; j < fw.length; j++) keep[i + j] = false;
    }
  }
  // Single time words at the start ("trưa ăn phở") are dropped too.
  const singles = ['sang', 'trua', 'chieu', 'toi'];
  if (keep[0] && singles.includes(foldedWords[0])) keep[0] = false;

  let note = words
    .filter((_, i) => keep[i])
    .join(' ')
    .replace(/^[\s,.;:+\-]+|[\s,.;:+\-]+$/g, '')
    .replace(/\s{2,}/g, ' ');
  if (note) note = note.charAt(0).toUpperCase() + note.slice(1);
  return note;
}

/** Split into clauses on separators; folded/original stay index-aligned because fold() keeps length for Vietnamese. */
function splitClauses(text: string): string[] {
  return text
    // "1,2tr" / "1,200,000": a comma between digits is part of a number, not a separator
    .replace(/(\d),(?=\d)/g, '$1.')
    .split(/[,;\n]+|\s+(?:rồi|roi|xong|sau đó|sau do|\+)\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

let keyCounter = 0;

export function parseExpenses(input: string): DraftTx[] {
  const drafts: DraftTx[] = [];
  let lastTime: { offset: number; label: string } | null = null;

  for (const clause of splitClauses(input.normalize('NFC'))) {
    const folded = fold(clause);
    const amounts = findMoney(folded);
    if (amounts.length === 0) continue;

    // A clause with several amounts ("phở 45k trà đá 5k") is split at amount boundaries.
    const pieces: { text: string; money: Money }[] = [];
    if (amounts.length === 1) {
      pieces.push({ text: clause, money: amounts[0] });
    } else {
      let cursor = 0;
      amounts.forEach((a, i) => {
        const endCut = i === amounts.length - 1 ? clause.length : a.end;
        const piece = clause.slice(cursor, endCut);
        pieces.push({ text: piece, money: { ...a, start: a.start - cursor, end: a.end - cursor } });
        cursor = endCut;
      });
    }

    for (const p of pieces) {
      const pf = fold(p.text);
      const time: { offset: number; label: string } | null = detectTime(pf) ?? lastTime;
      if (time) lastTime = time;
      const { categoryId, type } = detectCategory(pf);
      drafts.push({
        key: `d${Date.now().toString(36)}${keyCounter++}`,
        amount: p.money.value,
        type,
        categoryId,
        note: buildNote(p.text, p.money),
        dayOffset: time?.offset ?? 0,
        timeLabel: time?.label ?? 'Hôm nay',
      });
    }
  }
  return drafts;
}
