import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Screen } from '../../components/Screen';
import { TxRow } from '../../components/TxRow';
import { Card, Field, Seg, Txt } from '../../components/ui';
import { fold } from '../../lib/format';
import { useL, useLang, useMoney } from '../../lib/i18n';
import { startOfDay } from '../../lib/money';
import { useStore } from '../../lib/store';
import { Transaction } from '../../lib/types';
import { useColors } from '../../theme';

/** History tab (FR-039): grouped by day, accent-insensitive search, income/expense filter, delete from the row sheet. */
export default function History() {
  const { data } = useStore();
  const c = useColors();
  const L = useL();
  const lang = useLang();
  const { fmt } = useMoney();
  const [q, setQ] = useState('');
  const [f, setF] = useState<'all' | 'expense' | 'income'>('all');

  const groups = useMemo(() => {
    const k = fold(q.trim());
    const list = data.transactions.filter((t) => {
      if (f !== 'all' && t.type !== f) return false;
      if (!k) return true;
      const cat = data.categories.find((x) => x.id === t.categoryId);
      return fold(`${t.note} ${cat?.name ?? ''} ${cat?.nameEn ?? ''}`).includes(k);
    });
    const map = new Map<number, Transaction[]>();
    for (const t of list) {
      const day = startOfDay(new Date(t.date)).getTime();
      map.set(day, [...(map.get(day) ?? []), t]);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]).slice(0, 60);
  }, [data.transactions, data.categories, q, f]);

  const label = (ms: number) => {
    const d = new Date(ms);
    const today = startOfDay(new Date()).getTime();
    if (ms === today) return L('Hôm nay', 'Today');
    if (ms === today - 86_400_000) return L('Hôm qua', 'Yesterday');
    const s = d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'numeric' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <Screen title={L('Lịch sử', 'History')}>
      <Field value={q} onChangeText={setQ} placeholder={L('Tìm giao dịch…', 'Search transactions…')} accessibilityLabel={L('Tìm giao dịch', 'Search transactions')} returnKeyType="search" clearButtonMode="while-editing" />
      <Seg value={f} onChange={setF} options={[{ v: 'all', l: L('Tất cả', 'All') }, { v: 'expense', l: L('Chi', 'Spent') }, { v: 'income', l: L('Thu', 'Income') }]} />
      {groups.length === 0 ? (
        <Card><Txt color={c.sub} style={{ textAlign: 'center' }}>{L('Không có giao dịch nào khớp.', 'No matching transactions.')}</Txt></Card>
      ) : (
        groups.map(([day, txs]) => {
          const net = txs.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
          return (
            <View key={day} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                <Txt w="semibold" size={14}>{label(day)}</Txt>
                <Txt size={14} color={c.sub}>{net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}</Txt>
              </View>
              <Card style={{ paddingVertical: 4 }}>
                {txs.map((t, i) => <TxRow key={t.id} tx={t} last={i === txs.length - 1} />)}
              </Card>
            </View>
          );
        })
      )}
    </Screen>
  );
}
