import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { catName, useL, useLang, useMoney } from '../lib/i18n';
import { useCategory, useStore } from '../lib/store';
import { Transaction } from '../lib/types';
import { useColors } from '../theme';
import { CategoryIcon } from './icons/CategoryIcon';
import { Sheet } from './Sheet';
import { Btn, Txt } from './ui';

function hhmm(d: Date) {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/** One transaction row. Tap to see details / delete. */
export function TxRow({ tx, last, showDate }: { tx: Transaction; last?: boolean; showDate?: boolean }) {
  const cat = useCategory(tx.categoryId);
  const { data, deleteTransaction } = useStore();
  const L = useL();
  const lang = useLang();
  const { fmt } = useMoney();
  const c = useColors();
  const [open, setOpen] = useState(false);
  const income = tx.type === 'income';
  const d = new Date(tx.date);
  const wallet = data.wallets.find((w) => w.id === tx.walletId);
  const when = showDate ? d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' }) : hhmm(d);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${tx.note || catName(cat, lang)}, ${income ? L('thu', 'income') : L('chi', 'spent')} ${fmt(tx.amount)}`}
        onPress={() => setOpen(true)}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.lineSoft, opacity: pressed ? 0.6 : 1 })}>
        <CategoryIcon id={cat.icon} color={cat.color} />
        <View style={{ flex: 1, gap: 1 }}>
          <Txt w="medium" numberOfLines={1}>{tx.note || catName(cat, lang)}</Txt>
          <Txt size={13} color={c.sub} numberOfLines={1}>{catName(cat, lang)} · {when}</Txt>
        </View>
        <Txt w="semibold" color={income ? c.accent : c.ink}>{income ? '+' : '−'}{fmt(tx.amount)}</Txt>
      </Pressable>

      <Sheet visible={open} onClose={() => setOpen(false)} title={L('Chi tiết giao dịch', 'Transaction')}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <CategoryIcon id={cat.icon} color={cat.color} size={48} />
          <View style={{ flex: 1 }}>
            <Txt w="semibold" size={17}>{tx.note || catName(cat, lang)}</Txt>
            <Txt size={13} color={c.sub}>{catName(cat, lang)}{wallet ? ` · ${wallet.name}` : ''}</Txt>
          </View>
        </View>
        <Txt w="bold" size={30} color={income ? c.accent : c.ink}>{income ? '+' : '−'}{fmt(tx.amount)}</Txt>
        <Txt size={13} color={c.sub}>{d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')} {hhmm(d)}</Txt>
        <Btn label={L('Xóa giao dịch', 'Delete transaction')} kind="danger" onPress={() => { setOpen(false); deleteTransaction(tx.id); }} />
      </Sheet>
    </>
  );
}
