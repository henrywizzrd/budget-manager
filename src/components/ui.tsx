import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export const C = {
  bg: '#F4F5F2',
  card: '#FFFFFF',
  ink: '#15181C',
  sub: '#555C66',
  line: '#E3E5E8',
  lineSoft: '#EEF0F2',
  accent: '#0E6B58',
  accentSoft: '#E3F3EE',
  accentInk: '#0B4A3D',
  warn: '#C2600F',
  warnInk: '#7A3608',
  warnSoft: '#FFF4E8',
  warnBorder: '#F3D3B0',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
};

export const F = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
};

type Weight = keyof typeof F;

export function Txt({
  w = 'regular',
  size = 14,
  color = C.ink,
  style,
  ...rest
}: TextProps & { w?: Weight; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text {...rest} style={[{ fontFamily: F[w], fontSize: size, color, lineHeight: Math.round(size * 1.4) }, style]} />;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
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
  const bg = kind === 'primary' ? C.accent : kind === 'dark' ? C.ink : kind === 'danger' ? C.dangerSoft : C.card;
  const fg = kind === 'secondary' ? C.ink : kind === 'danger' ? C.danger : '#FFFFFF';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
        kind === 'secondary' && { borderWidth: 1, borderColor: C.line },
        style,
      ]}>
      {loading ? <ActivityIndicator color={fg} /> : <Txt w="semibold" color={fg}>{label}</Txt>}
    </Pressable>
  );
}

export function Badge({ text, fg, bg, size = 38 }: { text: string; fg: string; bg: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Txt w="bold" size={size * 0.34} color={fg}>{text}</Txt>
    </View>
  );
}

export function Progress({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: C.lineSoft, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export type IconName =
  | 'home' | 'pie' | 'plus' | 'chat' | 'settings' | 'bell' | 'spark' | 'back' | 'close' | 'trash'
  | 'send' | 'chevL' | 'chevR' | 'check' | 'list' | 'mic';

export function Icon({ name, size = 22, color = C.ink, stroke = 1.8 }: { name: IconName; size?: number; color?: string; stroke?: number }) {
  const p = { stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && <Path {...p} d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />}
      {name === 'pie' && (<><Circle {...p} cx="12" cy="12" r="9" /><Path {...p} d="M12 3v9l6.4 6.4" /></>)}
      {name === 'plus' && <Path {...p} d="M12 5v14M5 12h14" />}
      {name === 'chat' && <Path {...p} d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />}
      {name === 'settings' && (<><Circle {...p} cx="12" cy="12" r="3" /><Path {...p} d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>)}
      {name === 'bell' && (<><Path {...p} d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><Path {...p} d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>)}
      {name === 'spark' && (<><Path {...p} d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z" /><Path {...p} d="M19 15l.8 2 2 .8-2 .7-.8 2-.7-2-2-.7 2-.8z" /></>)}
      {name === 'back' && <Path {...p} d="M15 18l-6-6 6-6" />}
      {name === 'chevL' && <Path {...p} d="M15 18l-6-6 6-6" />}
      {name === 'chevR' && <Path {...p} d="M9 18l6-6-6-6" />}
      {name === 'close' && <Path {...p} d="M18 6L6 18M6 6l12 12" />}
      {name === 'trash' && <Path {...p} d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />}
      {name === 'send' && <Path {...p} d="M5 12h14M13 6l6 6-6 6" />}
      {name === 'check' && <Path {...p} d="M5 12l5 5L20 7" />}
      {name === 'list' && <Path {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />}
      {name === 'mic' && (<><Rect {...p} x="9" y="3" width="6" height="11" rx="3" /><Path {...p} d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>)}
    </Svg>
  );
}

export function IconButton({ name, label, onPress, color = C.ink, bg = C.card, size = 44, bordered = true }: {
  name: IconName; label: string; onPress: () => void; color?: string; bg?: string; size?: number; bordered?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => ({
        width: size, height: size, borderRadius: size / 2, backgroundColor: bg,
        borderWidth: bordered ? 1 : 0, borderColor: C.line,
        alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.7 : 1,
      })}>
      <Icon name={name} size={size * 0.45} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, padding: 16 },
  btn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
});
