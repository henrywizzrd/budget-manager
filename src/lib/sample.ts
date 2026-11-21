import { uid } from './format';
import { addRecurrence, ymd } from './money';
import { AppData, Transaction, TxType } from './types';

/** ~6 weeks of realistic student spending ending today, plus wallets, bills, subscriptions, debts and goals. */
export function makeSampleData(s: AppData, now = new Date()): AppData {
  const vi = s.settings.lang === 'vi';
  const wallets = [
    { id: 'cash', name: vi ? 'Tiền mặt' : 'Cash', type: 'cash' as const, initial: 1_500_000 },
    { id: 'bank', name: vi ? 'Ngân hàng' : 'Bank', type: 'bank' as const, initial: 4_000_000 },
    { id: 'momo', name: 'MoMo', type: 'ewallet' as const, initial: 300_000 },
  ];
  const out: Transaction[] = [];
  const add = (daysAgo: number, hour: number, amount: number, categoryId: string, note: string, walletId = 'cash', type: TxType = 'expense') => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour, Math.floor(Math.random() * 50));
    if (d > now) return;
    out.push({ id: uid(), amount, type, categoryId, walletId, note, date: d.toISOString(), createdAt: d.toISOString(), source: 'sample' });
  };
  const lunches = vi ? ['Phở bò', 'Cơm tấm', 'Bún bò', 'Bánh mì', 'Hủ tiếu', 'Cơm gà'] : ['Beef pho', 'Broken rice', 'Noodle soup', 'Banh mi', 'Rice bowl', 'Chicken rice'];
  const drinks = vi ? ['Cà phê sữa đá', 'Trà sữa', 'Bạc xỉu', 'Trà đào'] : ['Iced coffee', 'Milk tea', 'Latte', 'Peach tea'];
  for (let i = 0; i < 42; i++) {
    const weekday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i).getDay();
    add(i, 12, [35, 40, 45, 50, 55][i % 5] * 1000, 'an', lunches[i % lunches.length]);
    if (i % 2 === 0) add(i, 19, [60, 80, 120][i % 3] * 1000, 'an', vi ? (i % 6 === 0 ? 'Đi chợ' : 'Ăn tối') : i % 6 === 0 ? 'Groceries' : 'Dinner', 'momo');
    if (weekday !== 0 && (i < 7 || i % 2 === 0)) add(i, 9, [29, 35, 45][i % 3] * 1000, 'cf', drinks[i % drinks.length]);
    if (weekday >= 1 && weekday <= 5 && i % 2 === 1) add(i, 8, [25, 32][i % 2] * 1000, 'dc', vi ? 'Grab đi học' : 'Ride to class', 'momo');
    if (i % 9 === 3) add(i, 17, 80_000, 'dc', vi ? 'Đổ xăng' : 'Fuel');
    if (i % 7 === 4) add(i, 18, 60_000, 'tt', vi ? 'Sân cầu lông' : 'Badminton court');
    if (i % 11 === 5) add(i, 21, [150, 250][i % 2] * 1000, 'ms', vi ? 'Áo thun' : 'T-shirt', 'bank');
    if (i % 13 === 7) add(i, 20, 90_000, 'gt', vi ? 'Xem phim' : 'Movie');
    if (i % 17 === 2) add(i, 15, 95_000, 'ht', vi ? 'Sách giáo trình' : 'Textbook', 'bank');
  }
  for (const back of [1, 0]) {
    const daysAgo = (day: number) => Math.round((now.getTime() - new Date(now.getFullYear(), now.getMonth() - back, day, 9).getTime()) / 86_400_000);
    add(daysAgo(1), 10, 4_000_000, 'tn', vi ? 'Lương làm thêm' : 'Part-time pay', 'bank', 'income');
    add(daysAgo(3), 9, 2_000_000, 'hd', vi ? 'Tiền phòng' : 'Rent', 'bank');
    add(daysAgo(15), 9, 1_500_000, 'tn', vi ? 'Mẹ cho' : 'From mom', 'cash', 'income');
  }
  const t = (n: number) => ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + n));
  const firstOfNext = ymd(new Date(now.getFullYear(), now.getMonth() + 1, 3));
  return {
    ...s,
    wallets,
    transactions: out.sort((a, b) => b.date.localeCompare(a.date)),
    transfers: [{ id: uid(), from: 'bank', to: 'momo', amount: 2_500_000, date: new Date(now.getFullYear(), now.getMonth(), 2).toISOString() }],
    bills: [
      { id: uid(), name: vi ? 'Cước điện thoại' : 'Phone plan', amount: 120_000, recurrence: 'monthly', nextDue: t(4), remindDays: 2, categoryId: 'hd', active: true },
      { id: uid(), name: vi ? 'Điện nước phòng trọ' : 'Room utilities', amount: 450_000, recurrence: 'monthly', nextDue: t(7), remindDays: 2, categoryId: 'hd', active: true },
      { id: uid(), name: vi ? 'Tiền phòng' : 'Rent', amount: 2_000_000, recurrence: 'monthly', nextDue: firstOfNext, remindDays: 3, categoryId: 'hd', active: true },
    ],
    subs: [
      { id: uid(), name: 'Apple Music', type: 'sub_music', price: 60_000, cycle: 'm', nextRenew: t(5), remindDays: 3, remind: true },
      { id: uid(), name: 'Claude Pro', type: 'sub_ai', price: 500_000, cycle: 'm', nextRenew: t(12), remindDays: 3, remind: true },
      { id: uid(), name: 'iCloud+', type: 'sub_cloud', price: 20_000, cycle: 'm', nextRenew: t(10), remindDays: 1, remind: false },
    ],
    debts: [
      { id: uid(), direction: 'i_owe', counterparty: vi ? 'Trả góp laptop' : 'Laptop installment', total: 3_000_000, installments: 6, nextDue: t(9), paid: 1_000_000, paidCount: 2, note: '' },
      { id: uid(), direction: 'owed_to_me', counterparty: 'Minh', total: 150_000, installments: 0, nextDue: '', paid: 0, paidCount: 0, note: vi ? 'Tiền cơm' : 'Dinner' },
    ],
    goals: [
      { id: 'ef', name: vi ? 'Quỹ khẩn cấp' : 'Emergency fund', target: 1_000_000, saved: 230_000, emergency: true, dailyTarget: 10_000, days: Array.from({ length: 9 }, (_, i) => t(-1 - i)) },
      { id: uid(), name: vi ? 'Laptop mới' : 'New laptop', target: 12_000_000, saved: 1_200_000, emergency: false, dailyTarget: 0, days: [] },
    ],
    templates: [
      { id: uid(), name: vi ? 'Cà phê như mọi ngày' : 'Usual coffee', amount: 29_000, categoryId: 'cf' },
      { id: uid(), name: vi ? 'Cơm trưa' : 'Lunch', amount: 40_000, categoryId: 'an' },
      { id: uid(), name: vi ? 'Gửi xe' : 'Parking', amount: 5_000, categoryId: 'dc' },
    ],
    settings: { ...s.settings, payday: 1, onboarded: true },
  };
}

export { addRecurrence };
