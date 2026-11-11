/* Run with: npm test */
import { parseExpenses } from '../src/lib/parser';

type Expect = { amount: number; categoryId: string; type?: string; dayOffset?: number; note?: string };
const cases: [string, Expect[]][] = [
  ['trưa nay ăn bún bò 50k với Minh, chiều đổ xăng 80k, tối mua sách 120 nghìn', [
    { amount: 50_000, categoryId: 'an', note: 'Ăn bún bò với Minh' },
    { amount: 80_000, categoryId: 'dc', note: 'Đổ xăng' },
    { amount: 120_000, categoryId: 'ht', note: 'Mua sách' },
  ]],
  ['cafe 35', [{ amount: 35_000, categoryId: 'cf' }]],
  ['ca phe sua da 29k', [{ amount: 29_000, categoryId: 'cf' }]],
  ['2 ly trà sữa 60k', [{ amount: 60_000, categoryId: 'cf' }]],
  ['nhận lương 6tr', [{ amount: 6_000_000, categoryId: 'tn', type: 'income' }]],
  ['tiền nhà 2tr5', [{ amount: 2_500_000, categoryId: 'hd' }]],
  ['hôm qua grab 32.000đ', [{ amount: 32_000, categoryId: 'dc', dayOffset: -1 }]],
  ['phở 45k trà đá 5k', [{ amount: 45_000, categoryId: 'an' }, { amount: 5_000, categoryId: 'cf' }]],
  ['mua áo shopee 1,2tr', [{ amount: 1_200_000, categoryId: 'ms' }]],
  ['netflix 1 củ', [{ amount: 1_000_000, categoryId: 'gt' }]],
  ['thuốc cảm 85.000', [{ amount: 85_000, categoryId: 'sk' }]],
  ['mẹ cho 500k', [{ amount: 500_000, categoryId: 'tn', type: 'income' }]],
  ['xem phim cgv 2 vé 180k rồi ăn kem 30k', [{ amount: 180_000, categoryId: 'gt' }, { amount: 30_000, categoryId: 'an' }]],
  ['hello', []],
];

let fail = 0;
for (const [input, expected] of cases) {
  const got = parseExpenses(input);
  const ok =
    got.length === expected.length &&
    expected.every((e, i) =>
      got[i].amount === e.amount &&
      got[i].categoryId === e.categoryId &&
      (e.type === undefined || got[i].type === e.type) &&
      (e.dayOffset === undefined || got[i].dayOffset === e.dayOffset) &&
      (e.note === undefined || got[i].note === e.note));
  if (!ok) fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${input}`);
  if (!ok) console.log('      got:', got.map((g) => ({ a: g.amount, c: g.categoryId, t: g.type, d: g.dayOffset, n: g.note })));
}
console.log(fail ? `\n${fail} failed` : '\nAll parser tests passed');
if (fail) process.exit(1);
