import { describe, it, expect } from 'vitest';
import { toMarkdown } from './reportWriter';
import type { ScreenDiff } from './diffEngine';

const diff: ScreenDiff = {
  screen: 'profile', sourceDartPath: 'lib/features/pf_home/profile_tab.dart',
  nodeChanges: [{ id: 'btn', type: 'Button', key: 'borderRadius', from: 4, to: 8,
    flutter: 'FilledButton.style.shape.borderRadius' }],
  structural: [{ op: 'remove', id: 'gone' }],
};

describe('toMarkdown', () => {
  it('renders a human summary with the flutter mapping', () => {
    const md = toMarkdown(diff);
    expect(md).toContain('# Changes Report — profile');
    expect(md).toContain('borderRadius');
    expect(md).toContain('FilledButton.style.shape.borderRadius');
    expect(md).toContain('remove');
  });
});
