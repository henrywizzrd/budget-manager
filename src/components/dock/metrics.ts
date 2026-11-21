// Dock numbers from ZYX AppleDock.tsx (AM): margin, bar height, gap, chip height, chip gap.
export const AM = { M: 20, H: 62, GAP: 10, MH: 52, MGAP: 8 };
export const amBottom = (insetBottom: number) => Math.max(14, insetBottom - 8);
/** Bottom padding so the last item of a page can scroll clear of the dock and the chip. */
export const amEndPadding = (insetBottom: number) => amBottom(insetBottom) + AM.H + AM.MGAP + AM.MH + 16;
