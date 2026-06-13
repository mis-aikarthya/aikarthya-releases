import { describe, it, expect } from 'vitest';
import { ThemeSchema } from './schemas';

describe('ThemeSchema', () => {
  it('accepts a minimal valid theme', () => {
    const theme = {
      colors: { primary: '#006783' },
      typography: { bodyMedium: { fontFamily: 'Poppins', fontSize: 13, fontWeight: 400 } },
      spacing: { md: 16 },
      radius: { sm: 4 },
      shadow: { low: '0 2px 8px rgba(0,0,0,0.08)' },
      breakpoints: { mobile: 600, tablet: 1024, desktop: 1440, wide: 1920 },
    };
    expect(ThemeSchema.parse(theme)).toEqual(theme);
  });

  it('rejects a non-hex color', () => {
    const bad = {
      colors: { primary: 'teal' },
      typography: {}, spacing: {}, radius: {}, shadow: {},
      breakpoints: { mobile: 600, tablet: 1024, desktop: 1440, wide: 1920 },
    };
    expect(() => ThemeSchema.parse(bad)).toThrow();
  });
});
