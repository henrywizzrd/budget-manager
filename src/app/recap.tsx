import { useRef, useState } from 'react';
import { View } from 'react-native';

import { CategoryIcon } from '../components/icons/CategoryIcon';
import { Screen } from '../components/Screen';
import { Btn, Txt } from '../components/ui';
import { catName, useL, useLang, useMoney } from '../lib/i18n';
import { monthStats } from '../lib/insights';
import { streak } from '../lib/money';
import { useStore } from '../lib/store';
import { useColors } from '../theme';

/** Monthly recap card shared as an image (US13, FR-048). No account details on the card. */
export default function Recap() {
  const { data } = useStore();
  const c = useColors();
  const L = useL();
  const lang = useLang();
  const { fmt } = useMoney();
  const ref = useRef<any>(null);
  const [err, setErr] = useState('');
  const now = new Date();
  const m = monthStats(data.transactions, data.categories, now.getFullYear(), now.getMonth(), now, lang);
  const prevD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = monthStats(data.transactions, data.categories, prevD.getFullYear(), prevD.getMonth(), now, lang);
  const top = m.categories.filter((x) => x.spent > 0).slice(0, 3);
  const ef = data.goals.find((g) => g.emergency);
  const saved = data.goals.reduce((s, g) => s + g.saved, 0);
  const diff = prev.expense - m.expense;

  async function share() {
    setErr('');
    try {
      const { captureRef } = require('react-native-view-shot') as typeof import('react-native-view-shot');
      const Sharing = require('expo-sharing') as typeof import('expo-sharing');
      const uri = await captureRef(ref, { format: 'png', quality: 1 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'MYX' });
    } catch (e: any) {
      setErr(L('Không chia sẻ được ảnh trên máy này.', 'Could not share the image on this device.'));
    }
  }

  return (
    <Screen title={L('Recap tháng', 'Monthly recap')} back dock={false}>
      <View ref={ref} collapsable={false} style={{ backgroundColor: c.accent, borderRadius: 28, padding: 22, gap: 14 }}>
        <Txt w="bold" size={15} color="rgba(255,255,255,0.85)">MYX · {now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })}</Txt>
        <Txt w="bold" size={34} color="#FFFFFF" style={{ lineHeight: 40 }}>{L('Tháng của bạn', 'Your month')}</Txt>
        <View style={{ gap: 2 }}>
          <Txt size={14} color="rgba(255,255,255,0.85)">{L('Đã chi', 'Spent')}</Txt>
          <Txt w="bold" size={28} color="#FFFFFF">{fmt(m.expense)}</Txt>
          {prev.expense > 0 && <Txt size={14} color="rgba(255,255,255,0.9)">{diff >= 0 ? L(`Ít hơn tháng trước ${fmt(diff)}`, `${fmt(diff)} less than last month`) : L(`Nhiều hơn tháng trước ${fmt(-diff)}`, `${fmt(-diff)} more than last month`)}</Txt>}
        </View>
        <View style={{ gap: 8 }}>
          <Txt size={14} color="rgba(255,255,255,0.85)">{L('Chi nhiều nhất', 'Top categories')}</Txt>
          {top.map((x) => (
            <View key={x.category.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CategoryIcon id={x.category.icon} color="rgba(255,255,255,0.22)" size={34} />
              <Txt w="semibold" color="#FFFFFF" style={{ flex: 1 }}>{catName(x.category, lang)}</Txt>
              <Txt w="semibold" color="#FFFFFF">{fmt(x.spent)}</Txt>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, padding: 12 }}>
            <Txt size={13} color="rgba(255,255,255,0.85)">{L('Đã để dành', 'Saved')}</Txt>
            <Txt w="bold" size={18} color="#FFFFFF">{fmt(saved)}</Txt>
          </View>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: 18, padding: 12 }}>
            <Txt size={13} color="rgba(255,255,255,0.85)">{L('Chuỗi tiết kiệm', 'Saving streak')}</Txt>
            <Txt w="bold" size={18} color="#FFFFFF">{ef ? streak(ef.days, now) : 0} {L('ngày', 'days')}</Txt>
          </View>
        </View>
      </View>
      <Btn label={L('Chia sẻ ảnh', 'Share image')} onPress={share} />
      {!!err && <Txt size={13} color={c.danger}>{err}</Txt>}
    </Screen>
  );
}
