import { describe, it, expect } from 'vitest';
import { getDescriptors, getDescriptor } from './registry';

describe('registry', () => {
  it('returns descriptors for Text including a text content control', () => {
    const ds = getDescriptors('Text');
    expect(ds.find((d) => d.key === 'text')?.control).toBe('text');
  });
  it('looks up a single descriptor by widget+key', () => {
    expect(getDescriptor('Text', 'fontSize')?.control).toBe('number');
  });
  it('returns [] for an unknown widget', () => {
    expect(getDescriptors('Nope' as never)).toEqual([]);
  });
});
