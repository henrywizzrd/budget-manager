import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { CategoryIcon } from '../../components/icons/CategoryIcon';
import { Screen } from '../../components/Screen';
import { Sheet } from '../../components/Sheet';
import { Btn, Card, Field, Progress, Seg, Txt } from '../../components/ui';
import { uid } from '../../lib/format';
import { catName, useL, useLang, useMoney } from '../../lib/i18n';
import { monthStats } from '../../lib/insights';
import { DAY, startOfDay, streak, ymd } from '../../lib/money';
import { useStore } from '../../lib/store';
import { Goal } from '../../lib/types';
import { useColors } from '../../theme';

const num = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;

export default function Budget() {
  const { data, setCategoryLimit, upsertGoal, contribute, removeGoal, setJars, addTransaction } = useStore();
  const c = useColors();
  const L = useL();
  const lang = useLang();
  const { fmt } = useMoney();
  const [seg, setSeg] = useState<'b' | 'g' | 'j'>('b');
  const [edit, setEdit] = useState<string | null>(null);
  const [limit, setLimit] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [amt, setAmt] = useState('');
  const [income, setIncome] = useState('');
  const now = new Date();
  const m = monthStats(data.transactions, data.categories, now.getFullYear(), now.getMonth(), now, lang);
  const ef = data.goals.find((g) => g.emergency);
  const st = ef ? streak(ef.days, now) : 0;
  const savedToday = !!ef?.days.includes(ymd(now));
  const jarTotal = data.jars.reduce((s, j) => s + j.pct, 0);
  const editingCat = data.categories.find((x) => x.id === edit);

  return (
    <Screen title={L('Ngân sách', 'Budget')} back>
      <Seg value={seg} onChange={setSeg} options={[{ v: 'b', l: L('Ngân sách', 'Budget') }, { v: 'g', l: L('Mục tiêu', 'Goals') }, { v: 'j', l: L('Chia hũ', 'Jars') }]} />

      {seg === 'b' && (
        <>
          <Card style={{ gap: 6 }}>
            <Txt w="semibold">{(() => { const t = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); })()}</Txt>
            <Txt size={14} color={c.sub}>{L(`Đã chi ${fmt(m.expense)} / ${fmt(m.budget)}`, `Spent ${fmt(m.expense)} of ${fmt(m.budget)}`)}</Txt>
            <Progress pct={m.budget ? m.expense / m.budget : 0} height={12} color={m.expense > m.budget ? c.danger : c.accent} />
            <Txt size={13} color={c.sub}>{L(`Dự báo cuối tháng ${fmt(m.forecast)}`, `Month-end forecast ${fmt(m.forecast)}`)}</Txt>
          </Card>
          <Card style={{ paddingVertical: 4 }}>
            {m.categories.map((s, i) => (
              <Pressable key={s.category.id} accessibilityRole="button" onPress={() => { setEdit(s.category.id); setLimit(s.limit ? String(s.limit) : ''); }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: i === m.categories.length - 1 ? 0 : 1, borderBottomColor: c.lineSoft, opacity: pressed ? 0.6 : 1 })}>
                <CategoryIcon id={s.category.icon} color={s.category.color} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Txt w="medium" style={{ flexShrink: 1 }} numberOfLines={1}>{catName(s.category, lang)}</Txt>
                    {s.status !== 'ok' && (
                      <View style={{ paddingHorizontal: 8, borderRadius: 10, backgroundColor: s.status === 'over' ? c.dangerSoft : c.warnSoft }}>
                        <Txt size={12} w="semibold" color={s.status === 'over' ? c.danger : c.warnInk}>{s.status === 'over' ? L('Vượt', 'Over') : L('Sắp chạm', 'Close')}</Txt>
                      </View>
                    )}
                  </View>
                  <Txt size={13} color={c.sub}>{fmt(s.spent)} / {s.limit ? fmt(s.limit) : L('chưa đặt', 'no limit')}</Txt>
                  {s.limit > 0 && <Progress pct={s.pct} color={s.status === 'over' ? c.danger : s.status === 'warn' ? c.hi : c.accent} />}
                </View>
              </Pressable>
            ))}
          </Card>
        </>
      )}

      {seg === 'g' && (
        <>
          {ef && (
            <Card style={{ gap: 10 }}>
              <Txt w="bold" size={17}>{ef.name}</Txt>
              <Txt size={14} color={c.sub}>{L(`Mỗi ngày ${fmt(ef.dailyTarget)} · chuỗi ${st} ngày`, `${fmt(ef.dailyTarget)} a day · ${st}-day streak`)}</Txt>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {Array.from({ length: 14 }, (_, i) => {
                  const d = ymd(new Date(startOfDay(now).getTime() - (13 - i) * DAY));
                  return <View key={i} style={{ flex: 1, aspectRatio: 1, borderRadius: 5, backgroundColor: ef.days.includes(d) ? c.accent : c.lineSoft, borderWidth: i === 13 ? 2 : 0, borderColor: c.hi }} />;
                })}
              </View>
              <Txt w="bold" size={24}>{fmt(ef.saved)} <Txt size={14} color={c.sub}>/ {fmt(ef.target)}</Txt></Txt>
              <Btn label={savedToday ? L('Hôm nay đã để dành', 'Saved today') : L(`Hôm nay để dành ${fmt(ef.dailyTarget)}`, `Save ${fmt(ef.dailyTarget)} today`)} disabled={savedToday} onPress={() => contribute(ef.id, ef.dailyTarget)} />
            </Card>
          )}
          <Card style={{ paddingVertical: 4 }}>
            {data.goals.filter((g) => !g.emergency).length === 0 && <Txt size={14} color={c.sub} style={{ paddingVertical: 10 }}>{L('Chưa có mục tiêu nào.', 'No goals yet.')}</Txt>}
            {data.goals.filter((g) => !g.emergency).map((g, i, a) => (
              <Pressable key={g.id} accessibilityRole="button" onPress={() => { setGoal(g); setAmt(''); }} style={{ paddingVertical: 11, gap: 5, borderBottomWidth: i === a.length - 1 ? 0 : 1, borderBottomColor: c.lineSoft }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt w="medium">{g.name}</Txt>
                  <Txt w="semibold">{g.target ? Math.round((g.saved / g.target) * 100) : 0}%</Txt>
                </View>
                <Txt size={13} color={c.sub}>{fmt(g.saved)} / {fmt(g.target)}</Txt>
                <Progress pct={g.target ? g.saved / g.target : 0} />
              </Pressable>
            ))}
          </Card>
          <Btn label={L('+ Thêm mục tiêu', '+ Add goal')} kind="secondary" onPress={() => { setGoal({ id: '', name: '', target: 0, saved: 0, emergency: false, dailyTarget: 0, days: [] }); setAmt(''); }} />
        </>
      )}

      {seg === 'j' && (
        <>
          <Card style={{ gap: 4 }}>
            <Txt w="semibold">{L('Chia tiền theo hũ', 'Split money into jars')}</Txt>
            <Txt size={14} color={c.sub}>{L('Khi nhận lương hoặc tiền nhà gửi, MYX chia theo tỉ lệ dưới đây. Hũ Tiết kiệm và Khẩn cấp được chuyển vào quỹ khẩn cấp.', 'When income arrives, MYX splits it by these percentages. Savings and Emergency jars go into your emergency fund.')}</Txt>
            <Txt size={13} color={jarTotal === 100 ? c.sub : c.danger}>{L(`Tổng: ${jarTotal}%`, `Total: ${jarTotal}%`)}</Txt>
          </Card>
          <Card style={{ paddingVertical: 4 }}>
            {data.jars.map((j, i) => (
              <View key={j.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: i === data.jars.length - 1 ? 0 : 1, borderBottomColor: c.lineSoft }}>
                <Txt w="medium" style={{ flex: 1 }}>{j.name}</Txt>
                <Pressable accessibilityRole="button" accessibilityLabel="−5%" onPress={() => setJars(data.jars.map((x) => (x.id === j.id ? { ...x, pct: Math.max(0, x.pct - 5) } : x)))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Txt w="bold">−</Txt></Pressable>
                <Txt w="semibold" style={{ width: 44, textAlign: 'center' }}>{j.pct}%</Txt>
                <Pressable accessibilityRole="button" accessibilityLabel="+5%" onPress={() => setJars(data.jars.map((x) => (x.id === j.id ? { ...x, pct: Math.min(100, x.pct + 5) } : x)))} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.accentSoft, alignItems: 'center', justifyContent: 'center' }}><Txt w="bold">+</Txt></Pressable>
              </View>
            ))}
          </Card>
          <Field label={L('Vừa nhận (đ)', 'Just received (₫)')} keyboardType="number-pad" value={income} onChangeText={setIncome} placeholder="4000000" />
          {num(income) > 0 && (
            <Card style={{ gap: 6 }}>
              {data.jars.map((j) => (
                <View key={j.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt size={14} color={c.sub}>{j.name} · {j.pct}%</Txt>
                  <Txt size={14} w="semibold">{fmt(Math.round((num(income) * j.pct) / 100))}</Txt>
                </View>
              ))}
              <Btn
                label={L('Ghi thu nhập và chia hũ', 'Log income and split')}
                disabled={jarTotal !== 100}
                onPress={() => {
                  const n = num(income);
                  addTransaction({ amount: n, type: 'income', categoryId: 'tn', walletId: data.wallets[0]?.id ?? 'cash', note: L('Thu nhập (chia hũ)', 'Income (jars)'), date: new Date().toISOString(), source: 'manual' });
                  const save = data.jars.filter((j) => j.id === 'j3' || j.id === 'j5').reduce((s, j) => s + j.pct, 0);
                  if (ef && save) contribute(ef.id, Math.round((n * save) / 100));
                  setIncome('');
                }}
              />
            </Card>
          )}
        </>
      )}

      <Sheet visible={!!editingCat} onClose={() => setEdit(null)} title={L('Hạn mức tháng', 'Monthly limit')}>
        {editingCat && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CategoryIcon id={editingCat.icon} color={editingCat.color} />
              <Txt w="semibold" size={17}>{catName(editingCat, lang)}</Txt>
            </View>
            <Field keyboardType="number-pad" value={limit} onChangeText={setLimit} placeholder="0" autoFocus label={L('Hạn mức (đ, 0 = không giới hạn)', 'Limit (₫, 0 = none)')} />
            <Btn label={L('Lưu', 'Save')} onPress={() => { setCategoryLimit(editingCat.id, num(limit)); setEdit(null); }} />
          </>
        )}
      </Sheet>

      <Sheet visible={!!goal} onClose={() => setGoal(null)} title={goal?.id ? goal.name : L('Mục tiêu mới', 'New goal')}>
        {goal && !goal.id && (
          <>
            <Field label={L('Tên', 'Name')} value={goal.name} onChangeText={(v) => setGoal({ ...goal, name: v })} placeholder={L('Laptop mới', 'New laptop')} />
            <Field label={L('Số tiền cần (đ)', 'Target (₫)')} keyboardType="number-pad" value={goal.target ? String(goal.target) : ''} onChangeText={(v) => setGoal({ ...goal, target: num(v) })} />
            <Btn label={L('Tạo mục tiêu', 'Create goal')} disabled={!goal.name.trim() || !goal.target} onPress={() => { upsertGoal({ ...goal, id: uid(), name: goal.name.trim() }); setGoal(null); }} />
          </>
        )}
        {goal && !!goal.id && (
          <>
            <Txt size={14} color={c.sub}>{fmt(goal.saved)} / {fmt(goal.target)}</Txt>
            <Field label={L('Thêm vào (đ)', 'Add (₫)')} keyboardType="number-pad" value={amt} onChangeText={setAmt} autoFocus />
            <Btn label={L('Để dành', 'Save')} disabled={!num(amt)} onPress={() => { contribute(goal.id, num(amt)); setGoal(null); }} />
            <Btn label={L('Rút ra', 'Withdraw')} kind="secondary" disabled={!num(amt)} onPress={() => { contribute(goal.id, -num(amt)); setGoal(null); }} />
            <Btn label={L('Xóa mục tiêu', 'Delete goal')} kind="danger" onPress={() => { removeGoal(goal.id); setGoal(null); }} />
          </>
        )}
      </Sheet>
    </Screen>
  );
}
