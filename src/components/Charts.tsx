import { useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Text as SvgText } from 'react-native-svg';

import { useL, useLang, useMoney } from '../lib/i18n';
import { dailySeries, monthBars, safeToSpend, weekBars, weekTotal } from '../lib/money';
import { useStore } from '../lib/store';
import { useColors } from '../theme';
import { F, Seg, Txt } from './ui';

/** Home chart card: week/month bar chart + zig-zag daily line with the safe level (FR-040). */
export function SpendCharts() {
  const { data } = useStore();
  const c = useColors();
  const L = useL();
  const lang = useLang();
  const { fmt, short } = useMoney();
  const [per, setPer] = useState<'w' | 'm'>('w');
  const [w, setW] = useState(0);
  const now = new Date();
  const sts = safeToSpend(data, now);

  const bars = useMemo(() => {
    if (per === 'w') {
      const v = weekBars(data.transactions, now);
      const labels = lang === 'vi' ? ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const todayIdx = (now.getDay() + 6) % 7;
      return { v, labels, hi: todayIdx };
    }
    const m = monthBars(data.transactions, 6, now);
    const labels = m.map((x) => (lang === 'vi' ? `T${x.m + 1}` : new Date(x.y, x.m, 1).toLocaleDateString('en-US', { month: 'short' })));
    return { v: m.map((x) => x.value), labels, hi: 5 };
  }, [per, data.transactions, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const total = per === 'w' ? weekTotal(data.transactions, 0, now) : (bars.v[5] ?? 0);
  const cmp = per === 'w'
    ? L(`Tuần trước ${fmt(weekTotal(data.transactions, 1, now))}`, `Last week ${fmt(weekTotal(data.transactions, 1, now))}`)
    : (() => {
        const prev = (bars.v.slice(0, 5) as number[]).filter((x) => x > 0);
        const avg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : 0;
        return L(`Trung bình các tháng trước ${fmt(avg)}`, `Previous months average ${fmt(avg)}`);
      })();
  const max = Math.max(1, ...bars.v.map((x) => x ?? 0));

  const series = dailySeries(data.transactions, per === 'w' ? 14 : now.getDate(), now);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 20, padding: 16, gap: 10, borderWidth: 0.5, borderColor: c.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Txt w="semibold">{L('Chi tiêu', 'Spending')}</Txt>
          <Txt size={13} color={c.sub}>{per === 'w' ? L('Tuần này', 'This week') : L('Tháng này đến hôm nay', 'This month so far')}</Txt>
        </View>
        <Seg value={per} onChange={setPer} options={[{ v: 'w', l: L('Tuần', 'Week') }, { v: 'm', l: L('Tháng', 'Month') }]} style={{ width: 150 }} />
      </View>
      <View>
        <Txt w="bold" size={26} style={{ lineHeight: 30, letterSpacing: -0.4 }}>{fmt(total)}</Txt>
        <Txt size={13} color={c.sub}>{cmp}</Txt>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 150, gap: 6 }}>
        {bars.v.map((v, i) => (
          <View key={i} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <Txt size={11} w="semibold" numberOfLines={1}>{v ? short(v) : ''}</Txt>
            {v === null ? (
              <View style={{ width: '70%', maxWidth: 30, height: '20%', borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: c.line }} />
            ) : (
              <View style={{ width: '70%', maxWidth: 30, height: `${Math.max(3, (v / max) * 72)}%`, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, backgroundColor: i === bars.hi ? c.accent : c.accentSoft }} />
            )}
            <Txt size={11} color={c.sub}>{bars.labels[i]}</Txt>
          </View>
        ))}
      </View>

      <Txt w="semibold" style={{ marginTop: 6 }}>{L('Chi mỗi ngày', 'Daily spending')}</Txt>
      <View onLayout={onLayout} style={{ height: 150 }}>
        {w > 0 && <Line2 W={w} H={150} pts={series.map((s) => s.value)} days={series.map((s) => s.date.getDate())} safe={sts.daily} />}
      </View>
      <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
        <Legend color={c.accent} label={L('Đã chi', 'Spent')} />
        <Legend color={c.hi} dashed label={L(`Mức an toàn ${short(sts.daily)}/ngày`, `Safe level ${short(sts.daily)}/day`)} />
      </View>
    </View>
  );
}

function Legend({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 14, height: 0, borderTopWidth: 3, borderTopColor: color, borderStyle: dashed ? 'dashed' : 'solid' }} />
      <Txt size={13} color={c.sub}>{label}</Txt>
    </View>
  );
}

function Line2({ W, H, pts, days, safe }: { W: number; H: number; pts: number[]; days: number[]; safe: number }) {
  const c = useColors();
  const { short, hide } = useMoney();
  const n = pts.length;
  if (n < 2) return null;
  const l = 6, r = 46, t = 20, b = 22;
  const mx = Math.max(...pts, safe, 1) * 1.12;
  const X = (i: number) => l + (i * (W - l - r)) / (n - 1);
  const Y = (v: number) => t + (1 - v / mx) * (H - t - b);
  const poly = pts.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const area = `M${X(0)},${H - b} L${pts.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' L')} L${X(n - 1)},${H - b}Z`;
  const step = n <= 14 ? 2 : 5;
  const ticks = pts.map((_, i) => i).filter((i) => (i % step === 0 && n - 1 - i >= step / 2) || i === n - 1);
  const ys = Y(safe);
  const last = pts[n - 1];
  return (
    <Svg width={W} height={H}>
      <Path d={area} fill={c.accent} opacity={0.1} />
      <Line x1={l} x2={W - r + 4} y1={H - b} y2={H - b} stroke={c.line} />
      <Line x1={l} x2={W - r + 4} y1={ys} y2={ys} stroke={c.hi} strokeWidth={2} strokeDasharray="5 4" />
      {!hide && <SvgText x={W - r + 7} y={ys + 4} fontSize={12} fontFamily={F.medium} fill={c.sub}>{short(safe)}</SvgText>}
      <Polyline points={poly} fill="none" stroke={c.accent} strokeWidth={2.5} strokeLinejoin="miter" />
      {pts.map((v, i) => (
        <Circle key={i} cx={X(i)} cy={Y(v)} r={i === n - 1 ? 5 : 2.8} fill={i === n - 1 ? c.hi : c.accent} stroke={c.card} strokeWidth={i === n - 1 ? 2 : 1} />
      ))}
      {!hide && <SvgText x={X(n - 1)} y={Y(last) - 10} textAnchor="end" fontSize={12} fontFamily={F.bold} fill={c.ink}>{short(last)}</SvgText>}
      {ticks.map((i) => (
        <SvgText key={`t${i}`} x={X(i)} y={H - 5} textAnchor="middle" fontSize={12} fontFamily={F.regular} fill={c.sub}>{String(days[i])}</SvgText>
      ))}
    </Svg>
  );
}
