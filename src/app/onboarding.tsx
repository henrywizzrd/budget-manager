import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Field, Seg, Txt } from '../components/ui';
import { useL } from '../lib/i18n';
import { useStore } from '../lib/store';
import { useColors } from '../theme';

const num = (s: string) => parseInt(s.replace(/\D/g, ''), 10) || 0;

/** First run (US1): name, language, money in each wallet, payday. Under 2 minutes (SC-001). */
export default function Onboarding() {
  const { data, updateSettings, upsertWallet, loadSample } = useStore();
  const c = useColors();
  const L = useL();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(data.settings.userName);
  const [cash, setCash] = useState('');
  const [bank, setBank] = useState('');
  const [ewallet, setEwallet] = useState('');
  const [payday, setPayday] = useState('1');

  function finish() {
    const vi = data.settings.lang === 'vi';
    upsertWallet({ id: 'cash', name: vi ? 'Tiền mặt' : 'Cash', type: 'cash', initial: num(cash) });
    if (num(bank)) upsertWallet({ id: 'bank', name: vi ? 'Ngân hàng' : 'Bank', type: 'bank', initial: num(bank) });
    if (num(ewallet)) upsertWallet({ id: 'ewallet', name: vi ? 'Ví điện tử' : 'E-wallet', type: 'ewallet', initial: num(ewallet) });
    updateSettings({ userName: name.trim(), payday: Math.min(31, num(payday)), onboarded: true });
    router.replace('/');
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 16 }} keyboardShouldPersistTaps="handled">
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Txt w="bold" size={24} color={c.onAccent}>MYX</Txt>
      </View>
      <Txt w="bold" size={30} style={{ lineHeight: 36 }}>{L('Biết mỗi ngày tiêu được bao nhiêu', 'Know what you can spend each day')}</Txt>
      <Txt color={c.sub}>{L('Nhập số tiền bạn đang có và ngày nhận tiền, MYX sẽ tính ra con số an toàn cho hôm nay.', 'Enter the money you have and your payday; MYX works out a safe amount for today.')}</Txt>
      <Seg value={data.settings.lang} onChange={(v) => updateSettings({ lang: v })} options={[{ v: 'vi', l: 'Tiếng Việt' }, { v: 'en', l: 'English' }]} />
      <Field label={L('Tên của bạn', 'Your name')} value={name} onChangeText={setName} placeholder="Tyson" />
      <Field label={L('Tiền mặt (đ)', 'Cash (₫)')} keyboardType="number-pad" value={cash} onChangeText={setCash} placeholder="500000" />
      <Field label={L('Tài khoản ngân hàng (đ)', 'Bank account (₫)')} keyboardType="number-pad" value={bank} onChangeText={setBank} placeholder="2000000" />
      <Field label={L('Ví điện tử MoMo / ZaloPay (đ)', 'E-wallet (₫)')} keyboardType="number-pad" value={ewallet} onChangeText={setEwallet} placeholder="0" />
      <Field label={L('Ngày nhận tiền hằng tháng (1–31, 0 nếu không cố định)', 'Monthly payday (1–31, 0 if it varies)')} keyboardType="number-pad" value={payday} onChangeText={setPayday} />
      <Btn label={L('Bắt đầu', 'Start')} onPress={finish} />
      <Btn label={L('Dùng thử với dữ liệu mẫu', 'Try with sample data')} kind="secondary" onPress={() => { loadSample(); router.replace('/'); }} />
    </ScrollView>
  );
}
