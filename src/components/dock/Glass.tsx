// Glass layer (simplified from ZYX Glass.tsx).
//  - Real iOS Liquid Glass (expo-glass-effect) only for always-visible chrome (dock bar, round button).
//    Liquid Glass stops drawing if it or a parent ever has opacity < 1, so never put it inside a faded view.
//  - Everywhere else on iOS: expo-blur + tint + rim light. Android: dense tint + rim (no BlurTargetView yet).
//  - Reduce Transparency: solid surface.
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, View } from 'react-native';

import { useColors } from '../../theme';

type LGModule = typeof import('expo-glass-effect');
const LG: LGModule | null = (() => {
  if (Platform.OS !== 'ios') return null;
  try {
    const m = require('expo-glass-effect') as LGModule;
    return m.isLiquidGlassAvailable() && m.isGlassEffectAPIAvailable() ? m : null;
  } catch {
    return null;
  }
})();

function useReduceTransparency() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then((v) => alive && setOn(!!v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceTransparencyChanged', (v: boolean) => setOn(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return on;
}

export function glassShadow(dark: boolean) {
  const k = dark ? 1 : 0.55;
  return { boxShadow: `0px 2px 4px rgba(0,0,0,${(0.3 * k).toFixed(2)}), 0px 11px 26px rgba(0,0,0,${(0.22 * k).toFixed(2)})` } as const;
}

export function GlassFill({ radius, chrome = false, clear = false }: { radius: number; chrome?: boolean; clear?: boolean }) {
  const c = useColors();
  const reduce = useReduceTransparency();
  if (reduce || Platform.OS === 'web') {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, borderCurve: 'continuous', backgroundColor: clear ? 'transparent' : c.card, borderWidth: StyleSheet.hairlineWidth, borderColor: c.line }]} />;
  }
  if (LG && chrome) {
    return (
      <LG.GlassView
        pointerEvents="none"
        glassEffectStyle={clear ? 'clear' : 'regular'}
        colorScheme={c.dark ? 'dark' : 'light'}
        style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden', borderCurve: 'continuous' }]}
      />
    );
  }
  const android = Platform.OS === 'android';
  const tint = clear ? `rgba(${c.glassRgb},${android ? 0.12 : 0.04})` : `rgba(${c.glassRgb},${c.dark ? (android ? 0.78 : 0.6) : android ? 0.82 : 0.55})`;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden', borderCurve: 'continuous' }]}>
      {/* Android: real blur needs a BlurTargetView around the content (expo-blur docs); the dock uses a dense tint instead */}
      {!android && <BlurView intensity={clear ? 12 : 60} tint={c.dark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight'} style={StyleSheet.absoluteFill} />}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1, borderColor: c.dark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.75)', borderCurve: 'continuous' }]} />
    </View>
  );
}
