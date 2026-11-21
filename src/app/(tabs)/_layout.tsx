import { Redirect, router, usePathname } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { useState } from 'react';
import { View } from 'react-native';

import { DockTab, MyxDock } from '../../components/dock/MyxDock';
import { Sheet } from '../../components/Sheet';
import { Btn, Field } from '../../components/ui';
import { useL, useMoney } from '../../lib/i18n';
import { safeToSpend, ymd } from '../../lib/money';
import { useStore } from '../../lib/store';

function activeTab(path: string): DockTab | null {
  if (path.startsWith('/history')) return 'history';
  if (path.startsWith('/assistant')) return 'assistant';
  return 'index'; // Home, and Budget / Bills / Settings opened from Home
}

export default function TabsLayout() {
  const { data, setNote } = useStore();
  const L = useL();
  const { fmt } = useMoney();
  const path = usePathname();
  const [noteOpen, setNoteOpen] = useState(false);
  const [draft, setDraft] = useState('');
  if (!data.settings.onboarded) return <Redirect href="/onboarding" />;

  const s = safeToSpend(data);
  const note = data.notes[ymd(new Date())] ?? '';
  const href: Record<DockTab, '/' | '/history' | '/assistant'> = { index: '/', history: '/history', assistant: '/assistant' };

  return (
    <View style={{ flex: 1 }}>
      <Tabs style={{ flex: 1 }}>
        <TabSlot style={{ flex: 1 }} />
        {/* Triggers only register the routes; the visible navigation is MyxDock */}
        <TabList style={{ display: 'none' }}>
          <TabTrigger name="index" href="/" />
          <TabTrigger name="history" href="/history" />
          <TabTrigger name="assistant" href="/assistant" />
          <TabTrigger name="budget" href="/budget" />
          <TabTrigger name="bills" href="/bills" />
          <TabTrigger name="settings" href="/settings" />
        </TabList>
      </Tabs>
      <MyxDock
        active={activeTab(path)}
        labels={{ index: L('Trang chủ', 'Home'), history: L('Lịch sử', 'History'), assistant: L('Trợ lý', 'Assistant') }}
        onChange={(t) => router.navigate(href[t])}
        onAdd={() => router.push('/add')}
        addLabel={L('Thêm giao dịch', 'Add transaction')}
        chip={{
          title: L(`Hôm nay còn ${fmt(s.leftToday)}`, `${fmt(s.leftToday)} left today`),
          note: note || 'Note',
          noteEmpty: !note,
          pct: s.daily ? s.leftToday / s.daily : 0,
          a11y: L('Ghi chú hôm nay', "Today's note"),
          onPress: () => {
            setDraft(note);
            setNoteOpen(true);
          },
        }}
      />
      <Sheet visible={noteOpen} onClose={() => setNoteOpen(false)} title={L('Ghi chú hôm nay', "Today's note")}>
        <Field value={draft} onChangeText={setDraft} maxLength={80} autoFocus placeholder={L('Ví dụ: tối nay nấu ở nhà, không trà sữa', 'e.g. cook at home tonight, no milk tea')} />
        <Btn label={L('Lưu', 'Save')} onPress={() => { setNote(draft.trim()); setNoteOpen(false); }} />
        {!!note && <Btn label={L('Xóa ghi chú', 'Delete note')} kind="danger" onPress={() => { setNote(''); setNoteOpen(false); }} />}
      </Sheet>
    </View>
  );
}
