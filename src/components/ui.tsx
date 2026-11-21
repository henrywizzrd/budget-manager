import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useColors } from '../theme';

export const F = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
};

type Weight = keyof typeof F;

export function Txt({
  w = 'regular',
  size = 15,
  color,
  style,
  ...rest
}: TextProps & { w?: Weight; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text {...rest} style={[{ fontFamily: F[w], fontSize: size, color: color ?? c.ink, lineHeight: Math.round(size * 1.4) }, style]} />;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.line }, style]}>{children}</View>;
}

export function Btn({
  label,
  onPress,
  kind = 'primary',
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'dark' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const bg = kind === 'primary' ? c.accent : kind === 'dark' ? c.ink : kind === 'danger' ? c.dangerSoft : c.accentSoft;
  const fg = kind === 'secondary' ? c.ink : kind === 'danger' ? c.danger : kind === 'dark' ? c.bg : c.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.btn, { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 }, style]}>
      {loading ? <ActivityIndicator color={fg} /> : <Txt w="semibold" color={fg}>{label}</Txt>}
    </Pressable>
  );
}

/** Segmented control. */
export function Seg<T extends string | number>({ value, options, onChange, style }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <View style={[{ flexDirection: 'row', backgroundColor: c.accentSoft, borderRadius: 14, padding: 4 }, style]}>
      {options.map((o) => {
        const on = o.v === value;
        return (
          <Pressable
            key={String(o.v)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.v)}
            style={{ flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.card : 'transparent' }}>
            <Txt w="semibold" size={14} color={on ? c.ink : c.sub} numberOfLines={1}>{o.l}</Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({ label, style, ...props }: TextInputProps & { label?: string; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Txt w="medium" size={13} color={c.sub}>{label}</Txt> : null}
      <TextInput
        placeholderTextColor={c.faint}
        {...props}
        style={[{ minHeight: 48, borderRadius: 14, backgroundColor: c.card, borderWidth: 1, borderColor: c.line, paddingHorizontal: 14, fontFamily: F.regular, fontSize: 16, color: c.ink }, style]}
      />
    </View>
  );
}

export function Progress({ pct, color, height = 8 }: { pct: number; color?: string; height?: number }) {
  const c = useColors();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: c.lineSoft, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, height, borderRadius: height / 2, backgroundColor: color ?? c.accent }} />
    </View>
  );
}

export function Ring({ pct, size = 116, stroke = 14, color, track, children }: { pct: number; size?: number; stroke?: number; color: string; track: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, pct));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${C * f} ${C}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      {children}
    </View>
  );
}

export function Chip({ label, onPress, on }: { label: string; onPress: () => void; on?: boolean }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({ minHeight: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', borderWidth: 1, borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentSoft : c.card, opacity: pressed ? 0.7 : 1 })}>
      <Txt size={13} w={on ? 'semibold' : 'regular'}>{label}</Txt>
    </Pressable>
  );
}

export function Row({ left, title, sub, right, onPress, last }: { left?: ReactNode; title: string; sub?: string; right?: ReactNode; onPress?: () => void; last?: boolean }) {
  const c = useColors();
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.lineSoft }}>
      {left}
      <View style={{ flex: 1, gap: 1 }}>
        <Txt w="medium" numberOfLines={1}>{title}</Txt>
        {sub ? <Txt size={13} color={c.sub} numberOfLines={2}>{sub}</Txt> : null}
      </View>
      {right}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      {inner}
    </Pressable>
  );
}

export type IconName =
  | 'home' | 'pie' | 'plus' | 'chat' | 'settings' | 'bell' | 'spark' | 'back' | 'close' | 'trash' | 'history'
  | 'send' | 'chevL' | 'chevR' | 'check' | 'list' | 'mic' | 'pen' | 'eye' | 'eyeOff' | 'lock' | 'wallet' | 'swap' | 'share';

export function Icon({ name, size = 22, color, stroke = 1.8 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  const c = useColors();
  const p = { stroke: color ?? c.ink, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path {...p} d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />}
      {name === 'history' && (<><Path {...p} d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><Path {...p} d="M3 3v5h5M12 7v5l3 2" /></>)}
      {name === 'pie' && (<><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M12 3v9l6.4 6.4" /></>)}
      {name === 'plus' && <Path {...p} d="M12 5v14M5 12h14" />}
      {name === 'chat' && <Path {...p} d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />}
      {name === 'settings' && (<><Circle {...p} cx="12" cy="12" r="3" /><Path {...p} d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>)}
      {name === 'bell' && (<><Path {...p} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><Path {...p} d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>)}
      {name === 'spark' && (<><Path {...p} d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z" /><Path {...p} d="M19 15l.8 2 2 .8-2 .7-.8 2-.7-2-2-.7 2-.8z" /></>)}
      {(name === 'back' || name === 'chevL') && <Path {...p} d="M15 18l-6-6 6-6" />}
      {name === 'chevR' && <Path {...p} d="M9 18l6-6-6-6" />}
      {name === 'close' && <Path {...p} d="M18 6L6 18M6 6l12 12" />}
      {name === 'trash' && <Path {...p} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />}
      {name === 'send' && <Path {...p} d="M5 12h14M13 6l6 6-6 6" />}
      {name === 'check' && <Path {...p} d="M5 12l5 5L20 7" />}
      {name === 'list' && <Path {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />}
      {name === 'mic' && (<><Rect {...p} x="9" y="3" width="6" height="11" rx="3" /><Path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>)}
      {name === 'pen' && (<><Path {...p} d="M4 20h4L19 9l-4-4L4 16z" /><Path {...p} d="M14 6l4 4" /></>)}
      {name === 'eye' && (<><Path {...p} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><Circle {...p} cx="12" cy="12" r="3" /></>)}
      {name === 'eyeOff' && (<><Path {...p} d="M3 3l18 18M10.6 5.1A10.9 10.9 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><Path {...p} d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>)}
      {name === 'lock' && (<><Rect {...p} x="4" y="11" width="16" height="10" rx="2" /><Path {...p} d="M8 11V7a4 4 0 0 1 8 0v4" /></>)}
      {name === 'wallet' && (<><Path {...p} d="M3 7a2 2 0 0 1 2-2h13v4" /><Rect {...p} x="3" y="7" width="18" height="13" rx="2" /><Path {...p} d="M16 13.5h.01" /></>)}
      {name === 'swap' && <Path {...p} d="M7 7h11l-3-3M17 17H6l3 3" />}
      {name === 'share' && (<><Path {...p} d="M12 3v13M7 8l5-5 5 5" /><Path {...p} d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></>)}
    </Svg>
  );
}

export function IconButton({ name, label, onPress, color, bg, size = 44, bordered = true }: {
  name: IconName; label: string; onPress: () => void; color?: string; bg?: string; size?: number; bordered?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: size / 2, backgroundColor: bg ?? c.card,
        borderWidth: bordered ? 1 : 0, borderColor: c.line,
        alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1,
      })}>
      <Icon name={name} size={size * 0.45} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderCurve: 'continuous' },
  btn: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
});
