import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

export interface ThemeDef {
  id: string;
  vi: string;
  en: string;
  p: string; // primary
  a: string; // accent
  pro?: boolean;
}

export const THEMES: ThemeDef[] = [
  { id: 'leaf', vi: 'Lá', en: 'Leaf', p: '#12805C', a: '#F2B705' },
  { id: 'sea', vi: 'Biển', en: 'Sea', p: '#1565C0', a: '#FFB300' },
  { id: 'clay', vi: 'Cam đất', en: 'Clay', p: '#C2410C', a: '#2563EB' },
  { id: 'matcha', vi: 'Matcha', en: 'Matcha', p: '#5C7F3A', a: '#E8A33D', pro: true },
  { id: 'sakura', vi: 'Sakura', en: 'Sakura', p: '#C2255C', a: '#0CA678', pro: true },
  { id: 'coal', vi: 'Than', en: 'Coal', p: '#343A40', a: '#FAB005', pro: true },
];

export interface Colors {
  dark: boolean;
  bg: string;
  card: string;
  ink: string;
  sub: string;
  faint: string;
  line: string;
  lineSoft: string;
  accent: string; // theme primary
  accentSoft: string;
  accentInk: string;
  hi: string; // theme accent (highlight)
  onAccent: string;
  warn: string;
  warnInk: string;
  warnSoft: string;
  danger: string;
  dangerSoft: string;
  glassRgb: string;
}

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function makeColors(theme: ThemeDef, dark: boolean): Colors {
  const p = theme.p;
  if (dark) {
    return {
      dark,
      bg: mix('#0B0D0E', p, 0.08),
      card: mix('#16191B', p, 0.08),
      ink: '#EEF2F1',
      sub: '#A2ADB0',
      faint: '#6E787B',
      line: mix('#2A2F31', p, 0.15),
      lineSoft: mix('#202426', p, 0.1),
      accent: mix(p, '#FFFFFF', 0.18),
      accentSoft: mix('#16191B', p, 0.28),
      accentInk: mix(p, '#FFFFFF', 0.55),
      hi: theme.a,
      onAccent: '#FFFFFF',
      warn: '#F0A050',
      warnInk: '#F7C48E',
      warnSoft: '#3A2A18',
      danger: '#F06A60',
      dangerSoft: '#3A1E1C',
      glassRgb: '30,34,36',
    };
  }
  return {
    dark,
    bg: mix('#FFFFFF', p, 0.06),
    card: '#FFFFFF',
    ink: '#13181A',
    sub: '#56606A',
    faint: '#8A919B',
    line: mix('#E4E7E6', p, 0.1),
    lineSoft: mix('#EEF0F2', p, 0.06),
    accent: p,
    accentSoft: mix('#FFFFFF', p, 0.12),
    accentInk: mix(p, '#000000', 0.3),
    hi: theme.a,
    onAccent: '#FFFFFF',
    warn: '#C2600F',
    warnInk: '#7A3608',
    warnSoft: '#FFF4E8',
    danger: '#B42318',
    dangerSoft: '#FDECEA',
    glassRgb: '255,255,255',
  };
}

const Ctx = createContext<Colors>(makeColors(THEMES[0], false));

export function ThemeProvider({ themeId, appearance, children }: { themeId: string; appearance: 'light' | 'dark' | 'system'; children: ReactNode }) {
  const sys = useColorScheme();
  const dark = appearance === 'dark' || (appearance === 'system' && sys === 'dark');
  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];
  const colors = useMemo(() => makeColors(theme, dark), [theme, dark]);
  return <Ctx.Provider value={colors}>{children}</Ctx.Provider>;
}

export function useColors(): Colors {
  return useContext(Ctx);
}
