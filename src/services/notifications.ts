// Local reminders (expo-notifications, SDK 58 trigger API): bills, subscriptions, debt installments,
// daily recap (next 7 days, today's with real numbers) and a Sunday weekly summary.
// Everything is rescheduled from scratch whenever data changes.
import { Platform } from 'react-native';

import { vnd } from '../lib/format';
import { daysUntil, installmentAmount, parseYmd, safeToSpend } from '../lib/money';
import { AppData } from '../lib/types';

type N = typeof import('expo-notifications');
let mod: N | null | undefined;
function n(): N | null {
  if (mod !== undefined) return mod;
  try {
    mod = Platform.OS === 'web' ? null : (require('expo-notifications') as N);
  } catch {
    mod = null;
  }
  return mod;
}

export function setupNotifications() {
  const m = n();
  if (!m) return;
  m.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
  });
  if (Platform.OS === 'android') {
    m.setNotificationChannelAsync('reminders', { name: 'MYX', importance: m.AndroidImportance.DEFAULT }).catch(() => {});
  }
}

export async function ensurePermission(): Promise<boolean> {
  const m = n();
  if (!m) return false;
  try {
    const cur = await m.getPermissionsAsync();
    if (cur.granted || cur.ios?.status === 3) return true;
    const r = await m.requestPermissionsAsync();
    return r.granted || r.ios?.status === 3;
  } catch {
    return false;
  }
}

let timer: ReturnType<typeof setTimeout> | null = null;
/** Debounced: cancels everything and schedules again from the current data. */
export function scheduleAll(data: AppData) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    run(data).catch(() => {});
  }, 1500);
}

async function run(data: AppData) {
  const m = n();
  if (!m) return;
  const perm = await m.getPermissionsAsync().catch(() => null);
  if (!perm || !(perm.granted || perm.ios?.status === 3)) return;
  await m.cancelAllScheduledNotificationsAsync();
  const vi = data.settings.lang === 'vi';
  const fmt = (x: number) => (data.settings.hideAmounts ? '' : vi ? vnd(x) : vnd(x).replace(/\./g, ',').replace('đ', '₫'));
  const now = new Date();
  const channelId = Platform.OS === 'android' ? 'reminders' : undefined;
  const at = (ymdStr: string, daysBefore: number, hour = 9) => {
    const d = parseYmd(ymdStr);
    d.setDate(d.getDate() - daysBefore);
    d.setHours(hour, 0, 0, 0);
    return d;
  };
  const jobs: { title: string; body: string; date: Date }[] = [];

  for (const b of data.bills) {
    if (!b.active) continue;
    const d = at(b.nextDue, b.remindDays);
    if (d > now) jobs.push({ title: vi ? `${b.name} đến hạn sau ${b.remindDays} ngày` : `${b.name} due in ${b.remindDays} days`, body: vi ? `Chuẩn bị ${fmt(b.amount)}.` : `Get ${fmt(b.amount)} ready.`, date: d });
  }
  for (const s of data.subs) {
    if (!s.remind) continue;
    const d = at(s.nextRenew, s.remindDays);
    const day = `${s.nextRenew.slice(8, 10)}/${s.nextRenew.slice(5, 7)}`;
    if (d > now)
      jobs.push({
        title: vi ? `${s.name} gia hạn sau ${s.remindDays} ngày` : `${s.name} renews in ${s.remindDays} days`,
        body: vi ? `${fmt(s.price)} sẽ được trừ vào ${day}. Không dùng nữa thì hủy trước ngày này nhé.` : `${fmt(s.price)} will be charged on ${day}. Cancel before then if you no longer use it.`,
        date: d,
      });
  }
  for (const x of data.debts) {
    if (x.direction !== 'i_owe' || x.paid >= x.total || !x.nextDue || daysUntil(x.nextDue, now) < 0) continue;
    const d = at(x.nextDue, 2);
    if (d > now) jobs.push({ title: vi ? `Sắp đến kỳ trả: ${x.counterparty}` : `Payment due soon: ${x.counterparty}`, body: fmt(installmentAmount(x)), date: d });
  }
  if (data.settings.recap) {
    const s = safeToSpend(data, now);
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, data.settings.recapHour, 0);
      if (d <= now) continue;
      jobs.push(
        i === 0
          ? { title: vi ? 'Tổng kết hôm nay' : "Today's recap", body: vi ? `Hôm nay chi ${fmt(s.spentToday)}, còn dư ${fmt(s.leftToday)}.` : `Spent ${fmt(s.spentToday)} today, ${fmt(s.leftToday)} left over.`, date: d }
          : { title: vi ? 'Tổng kết hôm nay' : "Today's recap", body: vi ? 'Mở MYX xem hôm nay bạn đã chi bao nhiêu và giữ chuỗi tiết kiệm nhé.' : 'Open MYX to see what you spent today and keep your streak.', date: d },
      );
    }
  }
  for (const j of jobs.slice(0, 60)) {
    await m.scheduleNotificationAsync({ content: { title: j.title, body: j.body }, trigger: { type: m.SchedulableTriggerInputTypes.DATE, date: j.date, channelId } }).catch(() => {});
  }
  if (data.settings.weekly) {
    await m
      .scheduleNotificationAsync({
        content: { title: vi ? 'Tổng kết tuần' : 'Weekly summary', body: vi ? 'Xem tuần này bạn chi gì nhiều nhất và tiết kiệm được bao nhiêu.' : 'See where your money went this week and how much you saved.' },
        trigger: { type: m.SchedulableTriggerInputTypes.WEEKLY, weekday: 1, hour: 20, minute: 0, channelId },
      })
      .catch(() => {});
  }
}
