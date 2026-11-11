import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { relTime, vnd } from '../lib/format';
import { useCategory, useStore } from '../lib/store';
import { Transaction } from '../lib/types';
import { Sheet } from './Sheet';
import { Badge, Btn, C, Txt } from './ui';

/** One transaction row. Tap to see details / delete. */
export function TxRow({ tx, last }: { tx: Transaction; last?: boolean }) {
  const cat = useCategory(tx.categoryId);
  const { deleteTransaction } = useStore();
  const [open, setOpen] = useState(false);
  const income = tx.type === 'income';
  const d = new Date(tx.date);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${tx.note || cat.name}, ${income ? 'thu' : 'chi'} ${vnd(tx.amount)}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11,
          borderBottomWidth: last ? 0 : 1, borderBottomColor: C.lineSoft, opacity: pressed ? 0.6 : 1,
        })}>
        <Badge text={cat.short} fg={cat.fg} bg={cat.bg} />
        <View style={{ flex: 1, gap: 1 }}>
          <Txt w="medium" numberOfLines={1}>{tx.note || cat.name}</Txt>
          <Txt size={12} color={C.sub}>{cat.name} · {relTime(tx.date)}</Txt>
        </View>
        <Txt w="semibold" color={income ? C.accent : C.ink}>{income ? '+' : '-'}{vnd(tx.amount)}</Txt>
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Chi tiết giao dịch">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Badge text={cat.short} fg={cat.fg} bg={cat.bg} size={48} />
          <View style={{ flex: 1 }}>
            <Txt w="semibold" size={16}>{tx.note || cat.name}</Txt>
            <Txt size={13} color={C.sub}>{cat.name}</Txt>
          </View>
        </View>
        <Txt w="bold" size={28} color={income ? C.accent : C.ink}>{income ? '+' : '-'}{vnd(tx.amount)}</Txt>
        <Txt size={13} color={C.sub}>
          {d.toLocaleDateString('vi-VN')} {d.getHours().toString().padStart(2, '0')}:{d.getMinutes().toString().padStart(2, '0')}
          {tx.source === 'ai' || tx.source === 'gemini' ? ' · Ghi bằng AI' : tx.source === 'sample' ? ' · Dữ liệu mẫu' : ''}
        </Txt>
        <Btn label="Xóa giao dịch" kind="danger" onPress={() => { setOpen(false); deleteTransaction(tx.id); }} />
      </Sheet>
    </>
  );
}
