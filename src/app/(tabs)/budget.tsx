import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Sheet } from '../../components/Sheet';
import { Badge, Btn, C, Card, F, IconButton, Progress, Txt } from '../../components/ui';
import { MONTHS_VI, vnd, vndShort } from '../../lib/format';
import { CategoryStat, monthStats } from '../../lib/insights';
import { useStore } from '../../lib/store';

function Ring({ pct, color }: { pct: number; color: string }) {
  const r = 40;
  const len = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  return (
    <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }} accessibilityLabel={`Đã dùng ${Math.round(pct * 100)}% ngân sách`}>
      <Svg width={96} height={96} viewBox="0 0 96 96" style={{ position: 'absolute' }}>
        <Circle cx={48} cy={48} r={r} fill="none" stroke={C.lineSoft} strokeWidth={12} />
        {p > 0 && (
          <Circle cx={48} cy={48} r={r} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round"
            strokeDasharray={`${len * p} ${len}`} transform="rotate(-90 48 48)" />
        )}
      </Svg>
      <Txt w="bold" size={18}>{Math.round(pct * 100)}%</Txt>
    </View>
  );
}

export default function BudgetScreen() {
  const insets = useSafeAreaInsets();
  const { data, setCategoryLimit } = useStore();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [editing, setEditing] = useState<CategoryStat | null>(null);
  const [limitText, setLimitText] = useState('');

  const s = useMemo(() => monthStats(data.transactions, data.categories, cursor.y, cursor.m, now), [data, cursor]);
  const isCurrent = cursor.y === now.getFullYear() && cursor.m === now.getMonth();
  const pct = s.budget > 0 ? s.expense / s.budget : 0;
  const ringColor = pct > 1 ? C.danger : pct > 0.85 ? C.warn : C.accent;

  function shift(delta: number) {
    const d = new Date(cursor.y, cursor.m + delta, 1);
    if (d > now) return;
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  }

  function openEdit(c: CategoryStat) {
    setEditing(c);
    setLimitText(c.limit ? c.limit.toString() : '');
  }

  const limitValue = parseInt(limitText.replace(/\D/g, ''), 10) || 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt w="bold" size={22}>Ngân sách</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <IconButton name="chevL" label="Tháng trước" onPress={() => shift(-1)} size={36} />
          <Txt w="medium" size={13} style={{ minWidth: 92, textAlign: 'center' }}>{MONTHS_VI[cursor.m]}/{cursor.y}</Txt>
          <IconButton name="chevR" label="Tháng sau" onPress={() => shift(1)} size={36} color={isCurrent ? '#B8BDC4' : C.ink} />
        </View>
      </View>

      <Card style={{ flexDirection: 'row', gap: 18, alignItems: 'center', borderRadius: 22 }}>
        <Ring pct={pct} color={ringColor} />
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={13} color={C.sub}>Đã chi / Ngân sách</Txt>
          <Txt w="bold" size={20}>{vndShort(s.expense)} / {vndShort(s.budget)}</Txt>
          <Txt size={12} color={C.sub}>
            {isCurrent
              ? s.remaining > 0
                ? `Còn ${s.daysTotal - s.daysElapsed + 1} ngày · nên chi tối đa ${vnd(s.safePerDay)}/ngày`
                : `Đã vượt ${vnd(-s.remaining)}`
              : `Thu nhập tháng: ${vnd(s.income)}`}
          </Txt>
        </View>
      </Card>

      {isCurrent && s.budget > 0 && s.expense > 0 && (
        <View style={{ backgroundColor: s.forecast > s.budget ? C.warnSoft : C.accentSoft, borderRadius: 14, padding: 12 }}>
          <Txt size={13} color={s.forecast > s.budget ? C.warnInk : C.accentInk}>
            Dự báo AI: cuối tháng bạn sẽ chi khoảng {vnd(s.forecast)}
            {s.forecast > s.budget ? `, vượt ${vnd(s.forecast - s.budget)}.` : `, dư ${vnd(s.budget - s.forecast)}.`}
          </Txt>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Txt w="semibold" size={16}>Theo danh mục</Txt>
        <Txt size={12} color={C.sub}>Chạm để đặt hạn mức</Txt>
      </View>

      <View style={{ gap: 10 }}>
        {s.categories.map((c) => {
          const bar = c.status === 'over' ? C.danger : c.status === 'warn' ? C.warn : C.accent;
          return (
            <Pressable key={c.category.id} accessibilityRole="button" accessibilityLabel={`${c.category.name}, đặt hạn mức`} onPress={() => openEdit(c)}
              style={({ pressed }) => ({ backgroundColor: C.card, borderRadius: 16, padding: 14, gap: 9, opacity: pressed ? 0.7 : 1 })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Badge text={c.category.short} fg={c.category.fg} bg={c.category.bg} size={32} />
                <Txt w="medium" style={{ flex: 1 }} numberOfLines={1}>{c.category.name}</Txt>
                <Txt size={13} color={C.sub}>{vndShort(c.spent)} / {c.limit ? vndShort(c.limit) : '—'}</Txt>
              </View>
              {c.limit > 0 ? <Progress pct={c.pct} color={bar} /> : <Txt size={12} color={C.sub}>Chưa đặt hạn mức</Txt>}
              {!!c.note && isCurrent && <Txt w="medium" size={12} color={c.status === 'over' ? C.danger : '#9A4A0B'}>{c.note}</Txt>}
            </Pressable>
          );
        })}
      </View>

      <Sheet visible={!!editing} onClose={() => setEditing(null)} title={`Hạn mức: ${editing?.category.name ?? ''}`}>
        <Txt size={13} color={C.sub}>Số tiền tối đa bạn muốn chi cho mục này mỗi tháng. Để trống = không giới hạn.</Txt>
        <TextInput
          accessibilityLabel="Hạn mức mỗi tháng"
          value={limitValue ? limitValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''}
          onChangeText={setLimitText}
          keyboardType="number-pad"
          placeholder="VD: 2.000.000"
          placeholderTextColor="#8A919B"
          style={{ height: 56, borderRadius: 14, backgroundColor: C.bg, paddingHorizontal: 16, fontFamily: F.bold, fontSize: 24, color: C.ink }}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[300_000, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000].map((v) => (
            <Pressable key={v} accessibilityRole="button" onPress={() => setLimitText(v.toString())} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: C.line }}>
              <Txt size={13}>{vndShort(v)}</Txt>
            </Pressable>
          ))}
        </View>
        <Btn label="Lưu hạn mức" onPress={() => { if (editing) setCategoryLimit(editing.category.id, limitValue); setEditing(null); }} />
      </Sheet>
    </ScrollView>
  );
}
