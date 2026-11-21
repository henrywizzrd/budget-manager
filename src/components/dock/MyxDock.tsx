// MYX dock, ported from the owner's ZYX app (src/components/AppleDock.tsx, branch feature/player):
//  - glass pill tab bar (Home, History, Assistant) + separate round "+" button + "left today" chip above the bar
//  - tap a tab: the selection pill slides over, stretching slightly and settling
//  - hold (170 ms) or drag (6 px) on the bar: the pill swells into a magnifier lens that enlarges the icon under it,
//    follows the finger, stretches with velocity, and snaps to the nearest tab on release
//  - scrolling down collapses the bar into a round button and tucks the chip beside it (dockCollapse.ts)
// Every value a finger touches lives on the UI thread; scheduleOnRN only at gesture end / tab changes.
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { GestureDetector, usePanGesture, useSimultaneousGestures, useTapGesture } from 'react-native-gesture-handler';
import Animated, { SharedValue, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import Svg, { Circle, Path } from 'react-native-svg';

import { useColors } from '../../theme';
import { F, Icon } from '../ui';
import { dockCollapse, setDockCollapsed } from './dockCollapse';
import { cellIndex, lensTarget, velocityStretch } from './dockMath';
import { GlassFill, glassShadow } from './Glass';
import { hapticSnap, hapticTick } from './haptics';
import { AM, amBottom } from './metrics';

const SNAP = { stiffness: 420, damping: 32, mass: 1 };
const LENS = { stiffness: 600, damping: 38, mass: 1 };
const SQUISH = { stiffness: 600, damping: 28, mass: 1 };

export type DockTab = 'index' | 'history' | 'assistant';
export const DOCK_TABS: DockTab[] = ['index', 'history', 'assistant'];

function Glyph({ id, color, size = 26 }: { id: DockTab; color: string; size?: number }) {
  const p = { stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {id === 'index' && <Path {...p} d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />}
      {id === 'history' && (<><Path {...p} d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><Path {...p} d="M3 3v5h5M12 7v5l3 2" /></>)}
      {id === 'assistant' && (<><Path {...p} d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /><Path {...p} d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>)}
    </Svg>
  );
}

function Cell({ id, on, label, width }: { id: DockTab; on: boolean; label: string; width: number }) {
  const c = useColors();
  const color = on ? c.accent : c.ink;
  return (
    <View style={{ width, height: AM.H, alignItems: 'center', justifyContent: 'center' }}>
      <Glyph id={id} color={color} />
      <Text numberOfLines={1} style={{ color, fontSize: 11, fontFamily: F.semibold, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// The real cell under the lens fades out (the lens already shows its enlarged copy), so the clear lens never shows two icons.
function BaseCell({ i, tw, lensX, lensOn, children }: { i: number; tw: number; lensX: SharedValue<number>; lensOn: SharedValue<number>; children: React.ReactNode }) {
  const st = useAnimatedStyle(() => {
    const d = Math.abs(i * tw - lensX.value) / (tw * 0.8);
    return { opacity: 1 - lensOn.value * Math.max(0, 1 - d) };
  });
  return <Animated.View style={st}>{children}</Animated.View>;
}

export interface MyxDockProps {
  active: DockTab | null;
  labels: Record<DockTab, string>;
  onChange: (t: DockTab) => void;
  onAdd: () => void;
  addLabel: string;
  chip: { title: string; note: string; noteEmpty: boolean; pct: number; onPress: () => void; a11y: string };
}

export function MyxDock({ active, labels, onChange, onAdd, addLabel, chip }: MyxDockProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const reduced = useReducedMotion();
  const { M, H, GAP, MH, MGAP } = AM;
  const bottom = amBottom(insets.bottom);
  const tabs = DOCK_TABS;
  const n = tabs.length;
  const fullW = W - M * 2 - GAP - H;
  const tw = (fullW - 8) / n;
  const idx = active ? tabs.indexOf(active) : -1;
  const last = useRef(0);
  if (idx >= 0) last.current = idx;
  const shown = idx >= 0 ? idx : last.current;

  const pillX = useSharedValue(Math.max(0, idx) * tw);
  const pillSX = useSharedValue(1);
  const lensOn = useSharedValue(0);
  const lensX = useSharedValue(0);
  const lensSX = useSharedValue(1);
  const lensSY = useSharedValue(1);
  const lensIdx = useSharedValue(-1);
  const barPress = useSharedValue(1);
  const down = useSharedValue(0);
  const startX = useSharedValue(0);
  const twV = useSharedValue(tw);
  useEffect(() => {
    twV.value = tw;
  }, [tw]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (idx >= 0) pillX.value = withSpring(idx * tw, SNAP);
    setDockCollapsed(false);
  }, [idx, tw]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (i: number, stretch: boolean) => {
    const id = tabs[i];
    if (!id) return;
    if (stretch && i !== idx && !reduced) pillSX.value = withSequence(withTiming(1.22, { duration: 90 }), withSpring(1, SNAP));
    if (i !== idx) hapticTick();
    onChange(id);
  };
  const chooseRef = useRef(choose);
  chooseRef.current = choose;
  const pick = (i: number, stretch: boolean) => chooseRef.current(i, stretch);

  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      if (down.value === 1 && lensOn.value < 0.5) startLensUI(startX.value);
    }, 170);
  };
  function startLensUI(x: number) {
    'worklet';
    if (lensOn.value > 0.5 || dockCollapse.value > 0.5) return;
    lensX.value = pillX.value;
    lensOn.value = withSpring(1, LENS);
    lensX.value = withSpring(lensTarget(x, twV.value, n), LENS);
  }
  function release(x: number, tapOk: boolean) {
    'worklet';
    if (down.value !== 1) return;
    down.value = 0;
    barPress.value = withSpring(1, SQUISH);
    const w = twV.value;
    const i = cellIndex(x, w, n);
    if (lensOn.value > 0.01) {
      pillX.value = lensX.value;
      pillX.value = withSpring(i * w, SNAP);
      lensX.value = withSpring(i * w, LENS);
      lensOn.value = withSpring(0, LENS);
      lensSX.value = withSpring(1, LENS);
      lensSY.value = withSpring(1, LENS);
      scheduleOnRN(hapticSnap);
      scheduleOnRN(pick, i, false);
    } else if (tapOk) scheduleOnRN(pick, i, true);
  }
  const begin = (x: number) => {
    'worklet';
    if (dockCollapse.value > 0.5) {
      setDockCollapsed(false); // collapsed: a tap opens the dock
      down.value = 2;
      return;
    }
    if (down.value === 1) return;
    down.value = 1;
    startX.value = x;
    lensIdx.value = -1;
    barPress.value = withSpring(reduced ? 1 : 1.03, SQUISH);
    scheduleOnRN(armHold);
  };
  const drag = usePanGesture({
    activeOffsetX: [-6, 6],
    activeOffsetY: [-12, 12],
    onBegin: (e) => {
      'worklet';
      begin(e.x);
    },
    onActivate: (e) => {
      'worklet';
      if (down.value === 1 && Math.abs(e.translationX) >= Math.abs(e.translationY)) startLensUI(e.x);
    },
    onUpdate: (e) => {
      'worklet';
      if (down.value !== 1 || lensOn.value < 0.01) return;
      const w = twV.value;
      lensX.value = withSpring(lensTarget(e.x, w, n), LENS);
      if (!reduced) {
        const st = velocityStretch(e.velocityX);
        lensSX.value = withSpring(1 + st, { stiffness: 420, damping: 18 });
        lensSY.value = withSpring(1 - st * 0.55, { stiffness: 420, damping: 18 });
      }
      const i = cellIndex(e.x, w, n);
      if (i !== lensIdx.value) {
        if (lensIdx.value !== -1) scheduleOnRN(hapticTick);
        lensIdx.value = i;
      }
    },
    onDeactivate: (e) => {
      'worklet';
      release(e.x, false);
    },
  });
  const tap = useTapGesture({
    maxDuration: 1500,
    onBegin: (e) => {
      'worklet';
      begin(e.x);
    },
    onDeactivate: (e) => {
      'worklet';
      release(e.x, true);
    },
    onFinalize: () => {
      'worklet';
      if (down.value === 2) down.value = 0;
    },
  });
  const gesture = useSimultaneousGestures(drag, tap);

  // Collapse: only the glass layer changes width; the tab row fades (it holds no Liquid Glass); the chip only translates.
  const cl = dockCollapse;
  const glassW = useAnimatedStyle(() => ({ width: fullW + (H - fullW) * cl.value, transform: [{ scale: barPress.value }] }));
  const rowFade = useAnimatedStyle(() => ({ opacity: Math.max(0, 1 - cl.value * 2.2), transform: [{ scale: barPress.value }] }));
  const iconFade = useAnimatedStyle(() => ({ opacity: Math.max(0, (cl.value - 0.45) / 0.55) }));
  const pillStyle = useAnimatedStyle(() => ({
    opacity: idx >= 0 ? Math.max(0, 1 - cl.value * 2.2) * (1 - lensOn.value * 0.9) : 0,
    transform: [{ translateX: pillX.value }, { scaleX: pillSX.value }],
  }));
  const lw = tw + 10;
  const lh = H + 10;
  const lensStyle = useAnimatedStyle(() => {
    const s = 0.86 + 0.14 * lensOn.value;
    return { opacity: lensOn.value, transform: [{ translateX: lensX.value }, { scaleX: s * lensSX.value }, { scaleY: s * lensSY.value }] };
  });
  const lensRow = useAnimatedStyle(() => {
    const k = 1 + (reduced ? 0 : 0.18) * lensOn.value;
    const lx = 4 + lensX.value - 5;
    return { transform: [{ translateX: lw / 2 }, { translateY: lh / 2 }, { scale: k }, { translateX: -(lx - 4 + lw / 2) }, { translateY: -(lh / 2 - 5) }] };
  });

  const chipPress = useSharedValue(1);
  const addPress = useSharedValue(1);
  const fullMW = W - M * 2;
  const colW = W - M * 2 - H * 2 - GAP * 2;
  const dropY = H + MGAP - (H - MH) / 2;
  const chipStyle = useAnimatedStyle(() => ({
    width: fullMW + (colW - fullMW) * cl.value,
    transform: [{ translateX: (H + GAP) * cl.value }, { translateY: dropY * cl.value }, { scale: chipPress.value }],
  }));
  const addStyle = useAnimatedStyle(() => ({ transform: [{ scale: addPress.value }] }));
  const squish = (sv: SharedValue<number>, k: number) => ({
    onPressIn: () => (sv.value = withSpring(reduced ? 1 : k, SQUISH)),
    onPressOut: () => (sv.value = withSpring(1, SQUISH)),
  });

  const ringC = 2 * Math.PI * 14;
  const pct = Math.max(0, Math.min(1, chip.pct));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View pointerEvents="box-none" style={[styles.abs, { left: 0, right: 0, bottom, height: H + MGAP + MH + 20 }]}>
        {/* today chip (in place of ZYX's mini player) */}
        <Animated.View style={[styles.abs, { left: M, bottom: H + MGAP, height: MH, borderRadius: MH / 2, borderCurve: 'continuous' }, glassShadow(c.dark), chipStyle]}>
          <GlassFill radius={MH / 2} />
          <Pressable accessibilityRole="button" accessibilityLabel={chip.a11y} onPress={chip.onPress} {...squish(chipPress, 1.03)} style={styles.chipRow}>
            <Svg width={36} height={36} viewBox="0 0 36 36">
              <Circle cx={18} cy={18} r={14} stroke={c.line} strokeWidth={5} fill="none" />
              <Circle cx={18} cy={18} r={14} stroke={c.accent} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={`${ringC * pct} ${ringC}`} transform="rotate(-90 18 18)" />
            </Svg>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={{ color: c.ink, fontSize: 15, fontFamily: F.semibold }}>{chip.title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                {chip.noteEmpty ? <Icon name="pen" size={13} color={c.sub} /> : null}
                <Text numberOfLines={1} style={{ color: c.sub, fontSize: 13, fontFamily: F.regular, flexShrink: 1 }}>{chip.note}</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* tab bar: glass layer changes width (and takes the gesture); content sits above, fixed */}
        <View pointerEvents="box-none" style={[styles.abs, { left: M, bottom: 0, width: fullW, height: H }]}>
          <GestureDetector gesture={gesture}>
            <Animated.View accessibilityRole="tablist" style={[styles.abs, { left: 0, top: 0, height: H, borderRadius: H / 2, borderCurve: 'continuous' }, glassShadow(c.dark), glassW]}>
              <GlassFill radius={H / 2} chrome />
              <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, iconFade]}>
                <Glyph id={tabs[shown]} color={c.accent} size={28} />
              </Animated.View>
            </Animated.View>
          </GestureDetector>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, rowFade]}>
            <Animated.View style={[styles.pill, { width: tw, backgroundColor: c.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.065)' }, pillStyle]} />
            <View style={styles.row}>
              {tabs.map((id, i) => (
                <BaseCell key={id} i={i} tw={tw} lensX={lensX} lensOn={lensOn}>
                  <Cell id={id} on={i === idx} label={labels[id]} width={tw} />
                </BaseCell>
              ))}
            </View>
            <Animated.View style={[styles.lens, { left: -1, width: lw, height: lh, borderColor: c.dark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)' }, lensStyle]}>
              <GlassFill radius={lh / 2} clear />
              <Animated.View style={[styles.row, { left: 0, top: 0, width: fullW, height: H, transformOrigin: 'left top' }, lensRow]}>
                {tabs.map((id, i) => (
                  <Cell key={id} id={id} on={i === idx} label={labels[id]} width={tw} />
                ))}
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </View>

        {/* round add button (in place of ZYX's search button) */}
        <Animated.View style={[styles.abs, { right: M, bottom: 0, width: H, height: H, borderRadius: H / 2 }, glassShadow(c.dark), addStyle]}>
          <GlassFill radius={H / 2} chrome />
          <Pressable accessibilityRole="button" accessibilityLabel={addLabel} onPress={onAdd} {...squish(addPress, 1.12)} style={[StyleSheet.absoluteFill, styles.center]}>
            <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={26} color={c.onAccent} stroke={2.4} />
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { position: 'absolute', left: 4, top: 0, bottom: 0, flexDirection: 'row' },
  pill: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: 999 },
  lens: { position: 'absolute', top: -5, borderRadius: 999, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  chipRow: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 8, paddingRight: 14, gap: 10 },
});
