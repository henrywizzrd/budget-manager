import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TxRow } from '../../components/TxRow';
import { Btn, C, Card, Icon, Progress, Txt } from '../../components/ui';
import { monthLabel, vnd } from '../../lib/format';
import { buildInsights, monthStats } from '../../lib/insights';
import { useStore } from '../../lib/store';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { data, loadSample } = useStore();
  const now = new Date();
  const stats = useMemo(() => monthStats(data.transactions, data.categories, now.getFullYear(), now.getMonth(), now), [data]);
  const insight = useMemo(() => buildInsights(data.transactions, data.categories, now)[0], [data]);
  const recent = data.transactions.slice(0, 6);
  const name = data.settings.userName.trim();
  const usedPct = stats.budget > 0 ? stats.expense / stats.budget : 0;
  const over = stats.remaining < 0;
  const warnTone = insight?.tone === 'warn';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Txt size={13} color={C.sub}>{monthLabel(now)}</Txt>
          <Txt w="bold" size={22}>{name ? `Chào ${name}` : 'Xin chào'}</Txt>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xem tất cả giao dịch"
          onPress={() => router.push('/history')}
          style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: C.line, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="list" size={20} />
        </Pressable>
      </View>

      <View style={{ backgroundColor: over ? C.danger : C.accent, borderRadius: 24, padding: 22, gap: 16 }}>
        <View style={{ gap: 2 }}>
          <Txt size={13} color="#FFFFFF" style={{ opacity: 0.9 }}>{over ? 'Đã vượt ngân sách tháng' : 'Còn lại để chi tháng này'}</Txt>
          <Txt w="bold" size={34} color="#FFFFFF" style={{ lineHeight: 44 }}>{vnd(Math.abs(stats.remaining))}</Txt>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
          <View style={{ width: `${Math.min(1, usedPct) * 100}%`, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Txt size={13} color="#FFFFFF">Đã chi {vnd(stats.expense)}</Txt>
          <Txt size={13} color="#FFFFFF">Ngân sách {vnd(stats.budget)}</Txt>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Card style={{ flex: 1, gap: 2, paddingVertical: 14 }}>
          <Txt size={12} color={C.sub}>Thu nhập</Txt>
          <Txt w="semibold" size={17} color={C.accent}>{vnd(stats.income, true)}</Txt>
        </Card>
        <Card style={{ flex: 1, gap: 2, paddingVertical: 14 }}>
          <Txt size={12} color={C.sub}>Trung bình/ngày</Txt>
          <Txt w="semibold" size={17}>{vnd(stats.avgPerDay)}</Txt>
        </Card>
      </View>

      {insight && (
        <View style={{ backgroundColor: warnTone ? C.warnSoft : C.accentSoft, borderWidth: 1, borderColor: warnTone ? C.warnBorder : '#BFE3D8', borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: warnTone ? '#B4530F' : C.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="spark" size={18} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt w="semibold" size={13} color={warnTone ? C.warnInk : C.accentInk}>AI nhận xét · {insight.title}</Txt>
            <Txt size={13} color={warnTone ? '#3D2A1C' : C.accentInk}>{insight.text}</Txt>
            <Pressable accessibilityRole="link" onPress={() => router.push('/assistant')} hitSlop={8}>
              <Txt w="semibold" size={13} color={warnTone ? '#8A3D09' : C.accent}>Hỏi thêm trợ lý →</Txt>
            </Pressable>
          </View>
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Txt w="semibold" size={16}>Giao dịch gần đây</Txt>
        {data.transactions.length > 0 && (
          <Pressable accessibilityRole="link" onPress={() => router.push('/history')} hitSlop={10}>
            <Txt w="medium" size={13} color={C.accent}>Xem tất cả</Txt>
          </Pressable>
        )}
      </View>

      {recent.length > 0 ? (
        <Card style={{ paddingVertical: 4 }}>
          {recent.map((t, i) => <TxRow key={t.id} tx={t} last={i === recent.length - 1} />)}
        </Card>
      ) : (
        <Card style={{ gap: 12, alignItems: 'flex-start' }}>
          <Txt color={C.sub}>Chưa có giao dịch. Bấm nút + ở giữa thanh dưới để thêm, hoặc tạo dữ liệu mẫu để thử app.</Txt>
          <Btn label="Tạo dữ liệu mẫu" kind="secondary" onPress={loadSample} />
        </Card>
      )}

      {stats.budget > 0 && stats.categories.some((c) => c.spent > 0) && (
        <>
          <Txt w="semibold" size={16}>Top danh mục tháng này</Txt>
          <Card style={{ gap: 14 }}>
            {stats.categories.filter((c) => c.spent > 0).slice(0, 3).map((c) => (
              <View key={c.category.id} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt w="medium" size={13}>{c.category.name}</Txt>
                  <Txt size={13} color={C.sub}>{vnd(c.spent)}</Txt>
                </View>
                <Progress pct={c.limit ? c.pct : 0} color={c.status === 'over' ? C.danger : c.status === 'warn' ? C.warn : C.accent} />
              </View>
            ))}
          </Card>
        </>
      )}
    </ScrollView>
  );
}
