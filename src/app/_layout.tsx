import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppLock } from '../components/AppLock';
import { StoreProvider, useStore } from '../lib/store';
import { scheduleAll, setupNotifications } from '../services/notifications';
import { ThemeProvider, useColors } from '../theme';

setupNotifications();

function Nav() {
  const c = useColors();
  const { data, ready } = useStore();
  useEffect(() => {
    if (ready) scheduleAll(data);
  }, [data, ready]);
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }
  return (
    <AppLock>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="wallets" />
        <Stack.Screen name="recap" />
        <Stack.Screen name="pro" options={{ presentation: 'modal' }} />
      </Stack>
    </AppLock>
  );
}

function Themed() {
  const { data } = useStore();
  return (
    <ThemeProvider themeId={data.settings.theme} appearance={data.settings.appearance}>
      <Nav />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ BeVietnamPro_400Regular, BeVietnamPro_500Medium, BeVietnamPro_600SemiBold, BeVietnamPro_700Bold });
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1 }} />;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Themed />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
