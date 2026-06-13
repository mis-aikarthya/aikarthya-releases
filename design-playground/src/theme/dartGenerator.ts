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

const FAMILY_FN: Record<string, string> = { Poppins: 'poppins', Montserrat: 'montserrat' };

export function generateAppTypography(theme: Theme): string {
  const entries = Object.entries(theme.typography).map(([name, t]) => {
    const fn = FAMILY_FN[t.fontFamily] ?? 'poppins';
    const parts = [
      `fontSize: ${t.fontSize}`,
      `height: ${t.height ?? 1.2}`,
      `fontWeight: FontWeight.w${t.fontWeight}`,
    ];
    if (t.letterSpacing != null) parts.push(`letterSpacing: ${t.letterSpacing}`);
    return `  static TextStyle get ${name} => GoogleFonts.${fn}(\n    ${parts.join(',\n    ')},\n  );`;
  });
  return ['abstract final class AppTypography {', ...entries, '}'].join('\n');
}
