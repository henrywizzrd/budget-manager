// App lock (FR-045) with expo-local-authentication, and a privacy cover while the app is in the background,
// so the app switcher snapshot never shows amounts (SC-011).
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';

import { useL } from '../lib/i18n';
import { useStore } from '../lib/store';
import { useColors } from '../theme';
import { Btn, Icon, Txt } from './ui';

type LA = typeof import('expo-local-authentication');
let la: LA | null | undefined;
function auth(): LA | null {
  if (la !== undefined) return la;
  try {
    la = Platform.OS === 'web' ? null : (require('expo-local-authentication') as LA);
  } catch {
    la = null;
  }
  return la;
}

export async function canUseBiometrics(): Promise<boolean> {
  const m = auth();
  if (!m) return false;
  try {
    return (await m.hasHardwareAsync()) && (await m.isEnrolledAsync());
  } catch {
    return false;
  }
}

export function AppLock({ children }: { children: ReactNode }) {
  const { data } = useStore();
  const L = useL();
  const c = useColors();
  const enabled = data.settings.lock;
  const [locked, setLocked] = useState(enabled);
  const [cover, setCover] = useState(false);
  const leftAt = useRef<number | null>(null);

  const unlock = useCallback(async () => {
    const m = auth();
    if (!m) return setLocked(false);
    try {
      const r = await m.authenticateAsync({ promptMessage: L('Mở khóa MYX', 'Unlock MYX') });
      if (r.success) setLocked(false);
    } catch {}
  }, [L]);

  useEffect(() => {
    if (!enabled) setLocked(false);
  }, [enabled]);

  useEffect(() => {
    if (locked && enabled) unlock();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (!enabled) return;
      if (s !== 'active') {
        setCover(true);
        if (leftAt.current === null) leftAt.current = Date.now();
      } else {
        setCover(false);
        const away = leftAt.current ? (Date.now() - leftAt.current) / 1000 : 0;
        leftAt.current = null;
        if (away >= data.settings.lockDelay) {
          setLocked(true);
          unlock();
        }
      }
    });
    return () => sub.remove();
  }, [enabled, data.settings.lockDelay, unlock]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {enabled && (locked || cover) && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 }]}>
          <View style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="lock" size={34} color={c.onAccent} />
          </View>
          <Txt w="bold" size={22}>MYX</Txt>
          {locked && <Btn label={L('Mở khóa', 'Unlock')} onPress={unlock} style={{ alignSelf: 'stretch' }} />}
        </View>
      )}
    </View>
  );
}
