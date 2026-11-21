import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { ICON_GROUPS, ICONS, IconEl } from './iconData';

/** Two-tone MYX icon drawn inside a rounded colour tile (design/icons). */
export function CategoryIcon({ id, size = 38, color }: { id: string; size?: number; color?: string }) {
  const icon = ICONS[id] ?? ICONS.other;
  const c = color ?? ICON_GROUPS[icon.g]?.c ?? '#6B7378';
  const s = size * 0.62;
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.28, borderCurve: 'continuous', backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={s} height={s} viewBox="0 0 24 24">
        {icon.el.map((e, i) => draw(e, i, c))}
      </Svg>
    </View>
  );
}

function style(cls: string | undefined, tile: string, fill?: string) {
  if (fill) return { fill };
  switch (cls) {
    case 'f':
      return { fill: '#FFFFFF', fillOpacity: 0.38 };
    case 's':
      return { fill: 'none', stroke: '#FFFFFF', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    case 'b':
      return { fill: 'none', stroke: tile, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
    default:
      return { fill: '#FFFFFF' };
  }
}

function draw(e: IconEl, key: number, tile: string): React.ReactNode {
  const st = style(e.c, tile, e.fill);
  switch (e.t) {
    case 'g':
      return (
        <G key={key} transform={e.transform}>
          {(e.k ?? []).map((x, i) => draw(x, i, tile))}
        </G>
      );
    case 'path':
      return <Path key={key} d={e.d} {...st} />;
    case 'circle':
      return <Circle key={key} cx={e.cx} cy={e.cy} r={e.r} {...st} />;
    case 'ellipse':
      return <Ellipse key={key} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} {...st} />;
    case 'rect':
      return <Rect key={key} x={e.x} y={e.y} width={e.width} height={e.height} rx={e.rx} {...st} />;
    default:
      return null;
  }
}
