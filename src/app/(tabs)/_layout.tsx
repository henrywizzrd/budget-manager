import { router } from 'expo-router';
import { TabList, Tabs, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C, Icon, IconName, Txt } from '../../components/ui';

type TabButtonProps = TabTriggerSlotProps & { icon: IconName; label: string };

function TabButton({ icon, label, isFocused, ref: _ref, ...props }: TabButtonProps) {
  const color = isFocused ? C.accent : C.sub;
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      style={{ flex: 1, alignItems: 'center', gap: 3, paddingTop: 10, minHeight: 52 }}>
      <Icon name={icon} color={color} />
      <Txt size={11} w={isFocused ? 'semibold' : 'regular'} color={color}>{label}</Txt>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={{ flex: 1 }}>
      <TabSlot style={{ flex: 1 }} />
      <TabList
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: C.card,
          borderTopWidth: 1,
          borderTopColor: C.line,
          paddingBottom: Math.max(insets.bottom, 10),
          paddingHorizontal: 6,
        }}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton icon="home" label="Trang chủ" />
        </TabTrigger>
        <TabTrigger name="budget" href="/budget" asChild>
          <TabButton icon="pie" label="Ngân sách" />
        </TabTrigger>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thêm giao dịch bằng AI"
            onPress={() => router.push('/add')}
            style={({ pressed }) => ({
              width: 58, height: 58, borderRadius: 29, backgroundColor: C.ink, marginTop: -20,
              alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.85 : 1,
              shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
            })}>
            <Icon name="plus" color="#FFFFFF" size={26} stroke={2.2} />
          </Pressable>
        </View>
        <TabTrigger name="assistant" href="/assistant" asChild>
          <TabButton icon="chat" label="Trợ lý AI" />
        </TabTrigger>
        <TabTrigger name="settings" href="/settings" asChild>
          <TabButton icon="settings" label="Cài đặt" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}
