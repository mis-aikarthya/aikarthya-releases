import { describe, it, expect } from 'vitest';
import { ScreenModelSchema } from '@/model/schemas';
import profile from '../screens/profile.json';
describe('profile seed', () => {
  it('parses against ScreenModelSchema', () => {
    expect(() => ScreenModelSchema.parse(profile)).not.toThrow();
  });
  it('has the 6 top-level sections', () => {
    const p = ScreenModelSchema.parse(profile);
    expect(p.root.children?.length).toBe(6);
  });
});
