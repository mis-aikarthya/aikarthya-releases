import { describe, it, expect } from 'vitest';
import { defaultTheme } from './defaultTheme';
import { ThemeSchema } from '@/model/schemas';

describe('defaultTheme', () => {
  it('is a valid Theme', () => {
    expect(() => ThemeSchema.parse(defaultTheme)).not.toThrow();
  });
  it('mirrors the app primary color', () => {
    expect(defaultTheme.colors.primary).toBe('#006783');
  });
});
