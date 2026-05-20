export function snapPlayheadPx(px: number): number {
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  return Math.round(px * dpr) / dpr;
}
