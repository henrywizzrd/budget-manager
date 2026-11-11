/** 1250000 -> "1.250.000đ" (no Intl dependency, works on every JS engine). */
export function vnd(n: number, withSign = false): string {
  const abs = Math.round(Math.abs(n));
  const s = abs.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = n < 0 ? '-' : withSign && n > 0 ? '+' : '';
  return `${sign}${s}đ`;
}

/** Compact form: 1250000 -> "1,25tr", 45000 -> "45k". */
export function vndShort(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${sign}${trimNum(v)}tr`;
  }
  if (abs >= 1000) return `${sign}${trimNum(abs / 1000)}k`;
  return `${sign}${abs}đ`;
}

function trimNum(v: number): string {
  const r = Math.round(v * 100) / 100;
  return r.toString().replace('.', ',');
}

export const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

export function monthLabel(d: Date): string {
  return `${MONTHS_VI[d.getMonth()]}, ${d.getFullYear()}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function sameMonth(a: Date, y: number, m: number): boolean {
  return a.getFullYear() === y && a.getMonth() === m;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** "12:30", "Hôm qua", "05/11" */
export function relTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  if (sameDay(d, now)) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Hôm qua';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function dayHeader(d: Date, now = new Date()): string {
  if (sameDay(d, now)) return 'Hôm nay';
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return 'Hôm qua';
  const wd = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][d.getDay()];
  return `${wd}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Lowercase + strip Vietnamese diacritics, so "Cà phê" matches "ca phe". */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');
}
