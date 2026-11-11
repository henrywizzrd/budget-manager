import { uid } from './format';
import { Transaction, TxType } from './types';

/** Generates ~6 weeks of realistic sample transactions ending today, for testing. */
export function makeSampleTransactions(now = new Date()): Transaction[] {
  const out: Transaction[] = [];
  const add = (daysAgo: number, hour: number, amount: number, categoryId: string, note: string, type: TxType = 'expense') => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour, Math.floor(Math.random() * 50));
    if (d > now) return;
    out.push({ id: uid(), amount, type, categoryId, note, date: d.toISOString(), createdAt: d.toISOString(), source: 'sample' });
  };

  const lunches = ['Phở bò', 'Cơm tấm', 'Bún bò', 'Bánh mì', 'Hủ tiếu', 'Cơm gà'];
  const drinks = ['Highlands Coffee', 'Cà phê sữa đá', 'Trà sữa', 'Phúc Long', 'Bạc xỉu'];
  for (let i = 0; i < 42; i++) {
    const weekday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).getDay();
    add(i, 12, [35, 40, 45, 50, 55][i % 5] * 1000, 'an', lunches[i % lunches.length]);
    if (i % 2 === 0) add(i, 19, [60, 80, 120][i % 3] * 1000, 'an', i % 6 === 0 ? 'Đi chợ' : 'Ăn tối');
    // more coffee in the most recent week, so the insight "coffee up" shows
    if (weekday !== 0 && (i < 7 || i % 2 === 0)) add(i, 9, [29, 35, 45, 59][i % 4] * 1000, 'cf', drinks[i % drinks.length]);
    if (weekday >= 1 && weekday <= 5) add(i, 8, [25, 32, 40][i % 3] * 1000, 'dc', 'Grab đi làm');
    if (i % 9 === 3) add(i, 17, 80_000, 'dc', 'Đổ xăng');
    if (i % 11 === 5) add(i, 21, [150, 250, 390][i % 3] * 1000, 'ms', ['Áo thun', 'Shopee', 'Tai nghe'][i % 3]);
    if (i % 13 === 7) add(i, 20, 180_000, 'gt', 'Xem phim CGV');
    if (i % 17 === 2) add(i, 15, 120_000, 'ht', 'Mua sách');
  }
  // monthly items
  for (const back of [0, 1]) {
    const day = (n: number) => {
      const d = new Date(now.getFullYear(), now.getMonth() - back, n, 9);
      return Math.round((now.getTime() - d.getTime()) / 86400000);
    };
    add(day(5), 10, 6_000_000, 'tn', 'Lương thực tập', 'income');
    add(day(3), 9, 2_500_000, 'hd', 'Tiền phòng');
    add(day(8), 9, 250_000, 'hd', 'Internet + điện thoại');
    add(day(15), 9, 2_000_000, 'tn', 'Mẹ cho', 'income');
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
