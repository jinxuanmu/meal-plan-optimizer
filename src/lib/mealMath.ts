import type { Macros } from "@/types";

export const r = (v: number) => Math.round(v * 10) / 10;
export const r0 = (v: number) => Math.round(v);

export function kcalFromMacros(m: Macros): number {
  return r0(m.p * 4 + m.c * 4 + m.f * 9);
}

export function sumMacros(items: { p: number; c: number; f: number }[]): Macros {
  return items.reduce(
    (acc, x) => ({
      p: r(acc.p + x.p),
      c: r(acc.c + x.c),
      f: r(acc.f + x.f),
    }),
    { p: 0, c: 0, f: 0 },
  );
}
