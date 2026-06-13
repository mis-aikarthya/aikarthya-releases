import { describe, it, expect } from 'vitest';
import { generateAppColors } from './dartGenerator';
import { defaultTheme } from './defaultTheme';

describe('generateAppColors', () => {
  it('emits a Dart color constant in 0xAARRGGBB form', () => {
    const out = generateAppColors({ ...defaultTheme, colors: { primary: '#006783' } });
    expect(out).toContain('static const Color primary = Color(0xFF006783);');
  });
  it('preserves explicit alpha from #AARRGGBB', () => {
    const out = generateAppColors({ ...defaultTheme, colors: { scrim: '#80000000' } });
    expect(out).toContain('static const Color scrim = Color(0x80000000);');
  });
});
