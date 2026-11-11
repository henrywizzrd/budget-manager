import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TxRow } from '../components/TxRow';
import { C, Card, IconButton, Txt } from '../components/ui';
import { dayHeader, vnd } from '../lib/format';
import { useStore } from '../lib/store';
import { Transaction } from '../lib/types';

type Filter = 'all' | 'expense' | 'income';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { data } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [limit, setLimit] = useState(60);

  const groups = useMemo(() => {
    const list = data.transactions.filter((t) => filter === 'all' || t.type === filter).slice(0, limit);
    const map = new Map<string, Transaction[]>();
    for (const t of list) {
      const d = new Date(t.date);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(t);
    }
    return [...map.values()];
  }, [data.transactions, filter, limit]);

  const total = data.transactions.filter((t) => filter === 'all' || t.type === filter).length;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: insets.top + 8, paddingHorizontal: 12, paddingBottom: 8 }}>
        <IconButton name="back" label="Quay lại" onPress={() => router.back()} bordered={false} bg="transparent" />
        <Txt w="semibold" size={18}>Tất cả giao dịch</Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 8 }}>
        {([['all', 'Tất cả'], ['expense', 'Khoản chi'], ['income', 'Khoản thu']] as const).map(([f, l]) => (
          <Pressable key={f} accessibilityRole="tab" accessibilityState={{ selected: filter === f }} onPress={() => setFilter(f)}
            style={{ paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center', backgroundColor: filter === f ? C.ink : C.card, borderWidth: filter === f ? 0 : 1, borderColor: C.line }}>
            <Txt size={13} w="medium" color={filter === f ? '#FFFFFF' : C.ink}>{l}</Txt>
          </Pressable>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
        {groups.length === 0 && <Txt color={C.sub} style={{ marginTop: 24, textAlign: 'center' }}>Chưa có giao dịch nào.</Txt>}
        {groups.map((g) => {
          const spent = g.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          return (
            <View key={g[0].id} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                <Txt w="semibold" size={13} color={C.sub}>{dayHeader(new Date(g[0].date))}</Txt>
                {spent > 0 && <Txt size={13} color={C.sub}>-{vnd(spent)}</Txt>}
              </View>
              <Card style={{ paddingVertical: 4 }}>
                {g.map((t, i) => <TxRow key={t.id} tx={t} last={i === g.length - 1} />)}
              </Card>
            </View>
          );
        })}
        {total > limit && (
          <Pressable accessibilityRole="button" onPress={() => setLimit(limit + 60)} style={{ alignItems: 'center', padding: 12 }}>
            <Txt w="semibold" color={C.accent}>Xem thêm</Txt>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
