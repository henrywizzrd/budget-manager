import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Icon, IconButton, Txt } from '../components/ui';
import { useL } from '../lib/i18n';
import { useStore } from '../lib/store';
import { useColors } from '../theme';

/** Pro screen (US9). Test build: no real purchase yet (RevenueCat comes in M9). Core features are never gated (FR-033). */
export default function Pro() {
  const { data, updateSettings } = useStore();
  const c = useColors();
  const L = useL();
  const insets = useSafeAreaInsets();
  const items = [
    L('Trợ lý AI cloud thông minh hơn, 300 câu hỏi/tháng', 'Smarter cloud AI assistant, 300 questions a month'),
    L('Thêm theme Matcha, Sakura, Than', 'Extra themes: Matcha, Sakura, Coal'),
    L('Báo cáo nâng cao và xuất Excel', 'Advanced reports and Excel export'),
    L('Đồng bộ nhiều thiết bị (khi có tài khoản)', 'Multi-device sync (with an account)'),
  ];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 12, paddingHorizontal: 20, gap: 14 }}>
      <IconButton name="close" label={L('Đóng', 'Close')} onPress={() => router.back()} />
      <Txt w="bold" size={32}>MYX Pro</Txt>
      <Txt color={c.sub}>{L('Tính năng cốt lõi luôn miễn phí: số tiền tiêu được hôm nay, ghi chép, hóa đơn, nợ, ngân sách, mục tiêu.', 'Core features are always free: daily allowance, logging, bills, debts, budgets, goals.')}</Txt>
      {items.map((x) => (
        <View key={x} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={18} color={c.onAccent} /></View>
          <Txt style={{ flex: 1 }}>{x}</Txt>
        </View>
      ))}
      <Btn
        label={data.settings.pro ? L('Tắt Pro (bản thử)', 'Turn off Pro (test)') : L('Dùng thử Pro (bản thử nghiệm, miễn phí)', 'Try Pro (test build, free)')}
        onPress={() => { updateSettings({ pro: !data.settings.pro }); router.back(); }}
      />
      <Txt size={13} color={c.faint}>{L('Bản thử nghiệm chưa thu tiền thật. Giá Pro sẽ quyết định trước khi lên store.', 'This test build does not charge. Pro pricing will be decided before release.')}</Txt>
    </View>
  );
}
