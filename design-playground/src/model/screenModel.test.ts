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
});
