import { describe, it, expect } from 'vitest';
import { ScreenModelSchema } from './schemas';

describe('ScreenModelSchema', () => {
  it('validates a nested tree', () => {
    const screen = {
      screenName: 'demo',
      themeMode: 'light' as const,
      sourceDartPath: 'lib/x.dart',
      root: {
        id: 'r', type: 'Column', props: {},
        children: [{ id: 't', type: 'Text', props: { text: 'hi' } }],
      },
    };
    expect(ScreenModelSchema.parse(screen).root.children?.[0].type).toBe('Text');
  });

  it('rejects an unknown widget type', () => {
    const bad = {
      screenName: 'demo',
      themeMode: 'light' as const,
      sourceDartPath: 'lib/x.dart',
      root: { id: 'r', type: 'Foo', props: {} },
    };
    expect(() => ScreenModelSchema.parse(bad)).toThrow();
  });

  it('rejects a node missing required id', () => {
    const bad = {
      screenName: 'demo',
      themeMode: 'light' as const,
      sourceDartPath: 'lib/x.dart',
      root: { type: 'Column', props: {} },
    };
    expect(() => ScreenModelSchema.parse(bad)).toThrow();
  });

  it('validates a leaf node with no children key', () => {
    const screen = {
      screenName: 'demo',
      themeMode: 'light' as const,
      sourceDartPath: 'lib/x.dart',
      root: { id: 'r', type: 'Text', props: { text: 'hi' } },
    };
    expect(ScreenModelSchema.parse(screen).root.children).toBeUndefined();
  });
});
