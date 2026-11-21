// Pure helpers used by the dock gesture (also unit-tested in scripts/test-dock.ts).
export function cellIndex(x: number, tw: number, n: number): number {
  'worklet';
  return Math.max(0, Math.min(n - 1, Math.floor((x - 4) / tw)));
}
export function lensTarget(x: number, tw: number, n: number): number {
  'worklet';
  return Math.max(0, Math.min((n - 1) * tw, x - 4 - tw / 2));
}
export function velocityStretch(vx: number): number {
  'worklet';
  return Math.min(0.35, (Math.abs(vx) / 1000) * 0.22);
}
