// Collapse the dock while scrolling down, expand when scrolling up or near the top.
// Runs entirely on the UI thread (from ZYX src/components/dockCollapse.ts).
import { makeMutable, SharedValue, useAnimatedReaction, withSpring } from 'react-native-reanimated';

export const DOCK_SPRING = { stiffness: 300, damping: 28, mass: 1 };
export const dockCollapse = makeMutable(0); // 0 = full dock, 1 = collapsed
const target = makeMutable(0);

export function setDockCollapsed(on: boolean) {
  'worklet';
  const v = on ? 1 : 0;
  if (target.value === v) return;
  target.value = v;
  dockCollapse.value = withSpring(v, DOCK_SPRING);
}

export function useDockCollapse(scrollY: SharedValue<number>) {
  useAnimatedReaction(
    () => scrollY.value,
    (y, prev) => {
      if (prev == null) return;
      const d = y - prev;
      if (y < 30) setDockCollapsed(false);
      else if (d > 4) setDockCollapsed(true);
      else if (d < -6) setDockCollapsed(false);
    },
  );
}
