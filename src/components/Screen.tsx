import { router } from 'expo-router';
import { ReactNode } from 'react';
import { RefreshControlProps, View } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '../theme';
import { useDockCollapse } from './dock/dockCollapse';
import { amEndPadding } from './dock/metrics';
import { IconButton, Txt } from './ui';

/** Scrollable page that collapses the dock on scroll and leaves room for it at the bottom. */
export function Screen({ title, sub, back, right, children, refresh, dock = true }: {
  title?: string; sub?: string; back?: boolean; right?: ReactNode; children: ReactNode; refresh?: React.ReactElement<RefreshControlProps>; dock?: boolean;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const y = useSharedValue(0);
  useDockCollapse(y);
  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y;
  });
  return (
    <Animated.ScrollView
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={refresh}
      style={{ flex: 1, backgroundColor: c.bg }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: dock ? amEndPadding(insets.bottom) : insets.bottom + 24, gap: 12 }}>
      {(title || back || right) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          {back && <IconButton name="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.navigate('/'))} size={40} />}
          <View style={{ flex: 1 }}>
            {sub ? <Txt size={13} color={c.sub}>{sub}</Txt> : null}
            {title ? <Txt w="bold" size={28} style={{ lineHeight: 34, letterSpacing: -0.5 }}>{title}</Txt> : null}
          </View>
          {right}
        </View>
      )}
      {children}
    </Animated.ScrollView>
  );
}
