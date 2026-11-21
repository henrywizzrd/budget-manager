import { useState } from 'react';
import { Platform, Pressable, Switch, View } from 'react-native';

import { CategoryIcon } from '../../components/icons/CategoryIcon';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { Btn, Card, Field, Progress, Seg, Txt } from '../../components/ui';
import { uid } from '../../lib/format';
import { useL, useMoney } from '../../lib/i18n';
import { daysUntil, ddmm, installmentAmount, safeToSpend, subMonthly, subsAudit, ymd } from '../../lib/money';
import { useStore } from '../../lib/store';
import { Bill, Debt, Recurrence, Subscription, SubType } from '../../lib/types';
import { ensurePermission } from '../../services/notifications';
import { useColors } from '../../theme';

const num = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;
const SUBT: SubType[] = ['sub_ai', 'sub_music', 'sub_video', 'sub_cloud', 'sub_game', 'sub_app'];

/** dd/mm/yyyy <-> YYYY-MM-DD */
const toInput = (s: string) => (s ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '');
function fromInput(v: string): string | null {
  const m = v.trim().match(/^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?$/);
  if (!m) return null;
  const y = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : new Date().getFullYear();
  const d = new Date(y, +m[2] - 1, +m[1]);
  return isNaN(d.getTime()) ? null : ymd(d);
}
const defaultDue = () => ymd(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1));

export default function Bills() {
  const { data, upsertBill, payBill, removeBill, upsertSub, removeSub, upsertDebt, payDebt, removeDebt } = useStore();
  const c = useColors();
  const L = useL();
  const { fmt } = useMoney();
  const s = safeToSpend(data);
  const audit = subsAudit(data.subs);
  const [bill, setBill] = useState<(Bill & { due: string }) | null>(null);
  const [sub, setSub] = useState<(Subscription & { due: string }) | null>(null);
  const [debt, setDebt] = useState<(Debt & { due: string }) | null>(null);
  const [toast, setToast] = useState('');

  const days = (d: string) => {
    const n = daysUntil(d);
    return n === 0 ? L('hôm nay', 'today') : n < 0 ? L(`trễ ${-n} ngày`, `${-n} days late`) : L(`còn ${n} ngày`, `in ${n} days`);
  };

  async function previewSub(x: Subscription) {
    const ok = await ensurePermission();
    if (!ok) return setToast(L('Hãy cho phép thông báo trong Cài đặt của máy.', 'Allow notifications in your phone settings.'));
    try {
      const N = require('expo-notifications') as typeof import('expo-notifications');
      await N.scheduleNotificationAsync({
        content: {
          title: L(`${x.name} gia hạn sau ${x.remindDays} ngày`, `${x.name} renews in ${x.remindDays} days`),
          body: L(`${fmt(x.price)} sẽ được trừ vào ${ddmm(x.nextRenew)}. Không dùng nữa thì hủy trước ngày này nhé.`, `${fmt(x.price)} will be charged on ${ddmm(x.nextRenew)}. Cancel before then if you no longer use it.`),
        },
        trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 3, channelId: Platform.OS === 'android' ? 'reminders' : undefined },
      });
      setToast(L('Thông báo thử sẽ hiện sau 3 giây.', 'A test notification arrives in 3 seconds.'));
    } catch {
      setToast(L('Không gửi được thông báo thử.', 'Could not send a test notification.'));
    }
  }

  return (
    <Screen title={L('Hóa đơn & nợ', 'Bills & debts')} back>
      <View style={{ backgroundColor: c.accent, borderRadius: 24, padding: 16 }}>
        <Txt size={13} color="rgba(255,255,255,0.88)">{L(`Cần trả trước kỳ nhận tiền ${ddmm(s.periodEnd)}`, `Due before payday ${ddmm(s.periodEnd)}`)}</Txt>
        <Txt w="bold" size={30} color="#FFFFFF">{fmt(s.reserved)}</Txt>
      </View>
      {!!toast && <Card style={{ backgroundColor: c.accentSoft }}><Txt size={14}>{toast}</Txt></Card>}

      <Txt w="semibold" style={{ marginTop: 4 }}>{L('Hóa đơn định kỳ', 'Recurring bills')}</Txt>
      <Card style={{ paddingVertical: 4 }}>
        {data.bills.length === 0 && <Txt size={14} color={c.sub} style={{ paddingVertical: 10 }}>{L('Chưa có hóa đơn nào.', 'No bills yet.')}</Txt>}
        {data.bills.map((b, i) => {
          const cat = data.categories.find((x) => x.id === b.categoryId);
          return (
            <View key={b.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i === data.bills.length - 1 ? 0 : 1, borderBottomColor: c.lineSoft }}>
              <Pressable accessibilityRole="button" onPress={() => setBill({ ...b, due: toInput(b.nextDue) })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CategoryIcon id={cat?.icon ?? 'rent'} color={cat?.color} />
                <View style={{ flex: 1 }}>
                  <Txt w="medium" numberOfLines={1}>{b.name}</Txt>
                  <Txt size={13} color={c.sub}>{ddmm(b.nextDue)} · {days(b.nextDue)}</Txt>
                </View>
              </Pressable>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Txt w="semibold">{fmt(b.amount)}</Txt>
                <Pressable accessibilityRole="button" onPress={() => payBill(b.id)} style={{ paddingHorizontal: 12, minHeight: 32, justifyContent: 'center', borderRadius: 10, backgroundColor: c.accent }}>
                  <Txt size={13} w="semibold" color={c.onAccent}>{L('Đã trả', 'Paid')}</Txt>
                </Pressable>
              </View>
            </View>
          );
        })}
      </Card>
      <Btn label={L('+ Thêm hóa đơn', '+ Add bill')} kind="secondary" onPress={() => setBill({ id: '', name: '', amount: 0, recurrence: 'monthly', nextDue: defaultDue(), remindDays: 2, categoryId: 'hd', active: true, due: toInput(defaultDue()) })} />

      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 4 }}>
        <Txt w="semibold" style={{ flex: 1 }}>{L('Gói đăng ký', 'Subscriptions')}</Txt>
        <Txt size={13} color={c.sub}>{L(`${fmt(audit.monthly)}/tháng · ${fmt(audit.yearly)}/năm`, `${fmt(audit.monthly)}/mo · ${fmt(audit.yearly)}/yr`)}</Txt>
      </View>
      <Card style={{ paddingVertical: 4 }}>
        {data.subs.length === 0 && <Txt size={14} color={c.sub} style={{ paddingVertical: 10 }}>{L('Chưa có gói nào. Thêm Apple Music, Claude, iCloud… để được nhắc trước ngày gia hạn.', 'No plans yet. Add Apple Music, Claude, iCloud… to get reminded before renewal.')}</Txt>}
        {[...data.subs].sort((a, b) => a.nextRenew.localeCompare(b.nextRenew)).map((x, i, a) => (
          <Pressable key={x.id} accessibilityRole="button" onPress={() => setSub({ ...x, due: toInput(x.nextRenew) })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i === a.length - 1 ? 0 : 1, borderBottomColor: c.lineSoft }}>
            <CategoryIcon id={x.type} />
            <View style={{ flex: 1 }}>
              <Txt w="medium" numberOfLines={1}>{x.name}</Txt>
              <Txt size={13} color={c.sub}>{L('Gia hạn', 'Renews')} {ddmm(x.nextRenew)} · {days(x.nextRenew)}</Txt>
              <Txt size={13} w="semibold" color={x.remind ? c.accent : c.sub}>{x.remind ? L(`Nhắc trước ${x.remindDays} ngày`, `Reminder ${x.remindDays} days before`) : L('Đã tắt nhắc', 'Reminder off')}</Txt>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt w="semibold">{fmt(x.price)}</Txt>
              <Txt size={12} color={c.sub}>{x.cycle === 'y' ? L('/năm', '/yr') : L('/tháng', '/mo')}</Txt>
            </View>
          </Pressable>
        ))}
      </Card>
      <Btn label={L('+ Thêm gói đăng ký', '+ Add subscription')} kind="secondary" onPress={() => { const d = ymd(new Date(Date.now() + 14 * 86_400_000)); setSub({ id: '', name: '', type: 'sub_music', price: 0, cycle: 'm', nextRenew: d, remindDays: 3, remind: true, due: toInput(d) }); }} />

      <Txt w="semibold" style={{ marginTop: 4 }}>{L('Nợ & trả góp', 'Debts & installments')}</Txt>
      <Card style={{ paddingVertical: 4 }}>
        {data.debts.length === 0 && <Txt size={14} color={c.sub} style={{ paddingVertical: 10 }}>{L('Không có khoản nợ nào.', 'No debts.')}</Txt>}
        {data.debts.map((d, i) => {
          const done = d.paid >= d.total;
          const owedMe = d.direction === 'owed_to_me';
          return (
            <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: i === data.debts.length - 1 ? 0 : 1, borderBottomColor: c.lineSoft }}>
              <Pressable accessibilityRole="button" onPress={() => setDebt({ ...d, due: toInput(d.nextDue) })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <CategoryIcon id={owedMe ? 'lend' : 'gadget'} />
                <View style={{ flex: 1, gap: 3 }}>
                  <Txt w="medium" numberOfLines={1}>{owedMe ? L(`${d.counterparty} nợ bạn`, `${d.counterparty} owes you`) : d.counterparty}</Txt>
                  <Txt size={13} color={c.sub}>
                    {d.installments
                      ? L(`Kỳ ${Math.min(d.paidCount, d.installments)}/${d.installments} · còn ${fmt(d.total - d.paid)}`, `Paid ${Math.min(d.paidCount, d.installments)}/${d.installments} · ${fmt(d.total - d.paid)} left`)
                      : `${L('Còn', 'Left')} ${fmt(d.total - d.paid)}${d.note ? ` · ${d.note}` : ''}`}
                  </Txt>
                  {d.installments > 0 && <Progress pct={d.paid / d.total} />}
                </View>
              </Pressable>
              {done ? (
                <Txt size={13} w="semibold" color={c.accent}>{L('Xong', 'Settled')}</Txt>
              ) : (
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Txt w="semibold" color={owedMe ? c.accent : c.ink}>{fmt(installmentAmount(d))}</Txt>
                  <Pressable accessibilityRole="button" onPress={() => payDebt(d.id)} style={{ paddingHorizontal: 12, minHeight: 32, justifyContent: 'center', borderRadius: 10, backgroundColor: owedMe ? c.accentSoft : c.accent }}>
                    <Txt size={13} w="semibold" color={owedMe ? c.ink : c.onAccent}>{owedMe ? L('Đã nhận', 'Received') : L('Đã trả', 'Paid')}</Txt>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })}
      </Card>
      <Btn label={L('+ Thêm khoản nợ', '+ Add debt')} kind="secondary" onPress={() => setDebt({ id: '', direction: 'i_owe', counterparty: '', total: 0, installments: 0, nextDue: '', paid: 0, paidCount: 0, note: '', due: '' })} />

      {/* bill editor */}
      <Sheet visible={!!bill} onClose={() => setBill(null)} title={bill?.id ? L('Sửa hóa đơn', 'Edit bill') : L('Hóa đơn mới', 'New bill')}>
        {bill && (
          <>
            <Field label={L('Tên', 'Name')} value={bill.name} onChangeText={(v) => setBill({ ...bill, name: v })} placeholder={L('Tiền điện', 'Electricity')} />
            <Field label={L('Số tiền (đ)', 'Amount (₫)')} keyboardType="number-pad" value={bill.amount ? String(bill.amount) : ''} onChangeText={(v) => setBill({ ...bill, amount: num(v) })} />
            <Seg value={bill.recurrence} onChange={(v: Recurrence) => setBill({ ...bill, recurrence: v })} options={[{ v: 'weekly', l: L('Tuần', 'Weekly') }, { v: 'monthly', l: L('Tháng', 'Monthly') }, { v: 'yearly', l: L('Năm', 'Yearly') }]} />
            <Field label={L('Hạn tiếp theo (dd/mm/yyyy)', 'Next due (dd/mm/yyyy)')} value={bill.due} onChangeText={(v) => setBill({ ...bill, due: v })} keyboardType="numbers-and-punctuation" />
            <Txt w="medium" size={13} color={c.sub}>{L('Nhắc trước', 'Remind me')}</Txt>
            <Seg value={bill.remindDays} onChange={(v: number) => setBill({ ...bill, remindDays: v })} options={[1, 2, 3, 7].map((n) => ({ v: n, l: L(`${n} ngày`, `${n}d`) }))} />
            <Btn label={L('Lưu', 'Save')} disabled={!bill.name.trim() || !bill.amount || !fromInput(bill.due)} onPress={() => { const { due, ...b } = bill; upsertBill({ ...b, id: b.id || uid(), name: b.name.trim(), nextDue: fromInput(due)! }); setBill(null); ensurePermission(); }} />
            {!!bill.id && <Btn label={L('Xóa hóa đơn', 'Delete bill')} kind="danger" onPress={() => { removeBill(bill.id); setBill(null); }} />}
          </>
        )}
      </Sheet>

      {/* subscription editor (US17) */}
      <Sheet visible={!!sub} onClose={() => setSub(null)} title={sub?.id ? L('Sửa gói đăng ký', 'Edit subscription') : L('Thêm gói đăng ký', 'New subscription')}>
        {sub && (
          <>
            <Field label={L('Tên dịch vụ', 'Service name')} value={sub.name} onChangeText={(v) => setSub({ ...sub, name: v })} placeholder="Apple Music" />
            <Txt w="medium" size={13} color={c.sub}>{L('Loại', 'Type')}</Txt>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {SUBT.map((k) => (
                <Pressable key={k} accessibilityRole="button" accessibilityState={{ selected: sub.type === k }} accessibilityLabel={k} onPress={() => setSub({ ...sub, type: k })} style={{ padding: 2, borderRadius: 14, borderWidth: 2, borderColor: sub.type === k ? c.ink : 'transparent' }}>
                  <CategoryIcon id={k} size={40} />
                </Pressable>
              ))}
            </View>
            <Field label={L('Giá mỗi kỳ (đ)', 'Price per cycle (₫)')} keyboardType="number-pad" value={sub.price ? String(sub.price) : ''} onChangeText={(v) => setSub({ ...sub, price: num(v) })} placeholder="60000" />
            <Seg value={sub.cycle} onChange={(v: 'm' | 'y') => setSub({ ...sub, cycle: v })} options={[{ v: 'm', l: L('Hằng tháng', 'Monthly') }, { v: 'y', l: L('Hằng năm', 'Yearly') }]} />
            <Field label={L('Ngày gia hạn tiếp theo (dd/mm/yyyy)', 'Next renewal (dd/mm/yyyy)')} value={sub.due} onChangeText={(v) => setSub({ ...sub, due: v })} keyboardType="numbers-and-punctuation" />
            <Txt w="medium" size={13} color={c.sub}>{L('Nhắc trước', 'Remind me')}</Txt>
            <Seg value={sub.remindDays} onChange={(v: 1 | 3 | 7) => setSub({ ...sub, remindDays: v })} options={([1, 3, 7] as const).map((n) => ({ v: n, l: L(`${n} ngày`, n === 1 ? '1 day' : `${n} days`) }))} />
            <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44 }}>
              <Txt w="semibold" style={{ flex: 1 }}>{L('Bật thông báo nhắc', 'Reminder notifications')}</Txt>
              <Switch value={sub.remind} onValueChange={(v) => setSub({ ...sub, remind: v })} trackColor={{ true: c.accent }} />
            </View>
            {sub.price > 0 && <Txt size={13} color={c.sub}>{L(`Khoảng ${fmt(subMonthly(sub) * 12)} mỗi năm.`, `About ${fmt(subMonthly(sub) * 12)} a year.`)}</Txt>}
            <Btn label={L('Lưu', 'Save')} disabled={!sub.name.trim() || !sub.price || !fromInput(sub.due)} onPress={() => { const { due, ...x } = sub; upsertSub({ ...x, id: x.id || uid(), name: x.name.trim(), nextRenew: fromInput(due)! }); setSub(null); ensurePermission(); }} />
            <Btn label={L('Gửi thử thông báo', 'Send a test notification')} kind="secondary" disabled={!sub.name.trim() || !fromInput(sub.due)} onPress={() => previewSub({ ...sub, nextRenew: fromInput(sub.due) ?? sub.nextRenew })} />
            {!!sub.id && <Btn label={L('Xóa gói này', 'Delete subscription')} kind="danger" onPress={() => { removeSub(sub.id); setSub(null); }} />}
          </>
        )}
      </Sheet>

      {/* debt editor */}
      <Sheet visible={!!debt} onClose={() => setDebt(null)} title={debt?.id ? L('Sửa khoản nợ', 'Edit debt') : L('Khoản nợ mới', 'New debt')}>
        {debt && (
          <>
            <Seg value={debt.direction} onChange={(v: Debt['direction']) => setDebt({ ...debt, direction: v })} options={[{ v: 'i_owe', l: L('Mình nợ', 'I owe') }, { v: 'owed_to_me', l: L('Người khác nợ mình', 'Owed to me') }]} />
            <Field label={debt.direction === 'i_owe' ? L('Nợ ai / trả góp gì', 'Who / what') : L('Ai nợ', 'Who')} value={debt.counterparty} onChangeText={(v) => setDebt({ ...debt, counterparty: v })} />
            <Field label={L('Tổng số tiền (đ)', 'Total (₫)')} keyboardType="number-pad" value={debt.total ? String(debt.total) : ''} onChangeText={(v) => setDebt({ ...debt, total: num(v) })} />
            {debt.direction === 'i_owe' && (
              <>
                <Field label={L('Số kỳ trả góp (0 = trả một lần)', 'Installments (0 = single payment)')} keyboardType="number-pad" value={String(debt.installments)} onChangeText={(v) => setDebt({ ...debt, installments: num(v) })} />
                <Field label={L('Kỳ trả tiếp theo (dd/mm/yyyy)', 'Next payment (dd/mm/yyyy)')} value={debt.due} onChangeText={(v) => setDebt({ ...debt, due: v })} keyboardType="numbers-and-punctuation" />
              </>
            )}
            <Field label={L('Ghi chú', 'Note')} value={debt.note} onChangeText={(v) => setDebt({ ...debt, note: v })} />
            <Btn label={L('Lưu', 'Save')} disabled={!debt.counterparty.trim() || !debt.total} onPress={() => { const { due, ...d } = debt; upsertDebt({ ...d, id: d.id || uid(), counterparty: d.counterparty.trim(), nextDue: fromInput(due) ?? '' }); setDebt(null); }} />
            {!!debt.id && <Btn label={L('Xóa khoản nợ', 'Delete debt')} kind="danger" onPress={() => { removeDebt(debt.id); setDebt(null); }} />}
          </>
        )}
      </Sheet>
    </Screen>
  );
}
