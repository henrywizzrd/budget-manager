// Haptics (from ZYX): one tick per user action, in the same frame as the visual change.
// Lazy require + try so a JS update on an old binary never crashes.
import { Platform } from 'react-native';

type H = typeof import('expo-haptics');
let mod: H | null | undefined;
function h(): H | null {
  if (mod !== undefined) return mod;
  try {
    mod = Platform.OS === 'web' ? null : (require('expo-haptics') as H);
  } catch {
    mod = null;
  }
  return mod;
}

export function hapticTick() {
  try {
    h()?.selectionAsync().catch(() => {});
  } catch {}
}
export function hapticSnap() {
  try {
    const m = h();
    m?.impactAsync(m.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {}
}
