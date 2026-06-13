import { describe, it, expect } from 'vitest';
import { defaultProps } from './defaults';

describe('defaultProps', () => {
  it('builds a props object from descriptor defaults', () => {
    const p = defaultProps('Text');
    expect(p.text).toBe('');
    expect(p.fontSize).toBe(13);
  });
});
