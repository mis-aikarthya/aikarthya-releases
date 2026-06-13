import type { Theme } from '@/model/types';

/** '#RRGGBB' -> '0xFFRRGGBB', '#AARRGGBB' -> '0xAARRGGBB'. */
export function hexToDart(hex: string): string {
  const h = hex.replace('#', '').toUpperCase();
  const argb = h.length === 6 ? `FF${h}` : h; // assume input #AARRGGBB when 8 chars
  return `0x${argb}`;
}

export function generateAppColors(theme: Theme): string {
  const lines = Object.entries(theme.colors).map(
    ([name, hex]) => `  static const Color ${name} = Color(${hexToDart(hex)});`,
  );
  return ['abstract final class AppColors {', ...lines, '}'].join('\n');
}
