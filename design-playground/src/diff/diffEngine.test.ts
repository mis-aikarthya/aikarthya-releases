import { describe, it, expect } from 'vitest';
import { diffScreens } from './diffEngine';
import type { ScreenModel } from '@/model/types';

const base: ScreenModel = {
  screenName: 'p', themeMode: 'light', sourceDartPath: 'p.dart',
  root: { id: 'root', type: 'Column', props: {}, children: [
    { id: 'btn', type: 'Button', props: { borderRadius: 4, text: 'Go' } },
    { id: 'gone', type: 'Text', props: { text: 'x' } },
  ] },
};

describe('diffScreens', () => {
  it('detects a prop change', () => {
    const edited = structuredClone(base);
    edited.root.children![0].props.borderRadius = 8;
    const d = diffScreens(base, edited);
    expect(d.nodeChanges).toContainEqual(
      expect.objectContaining({ id: 'btn', key: 'borderRadius', from: 4, to: 8 }),
    );
  });
  it('detects a removed node', () => {
    const edited = structuredClone(base);
    edited.root.children = edited.root.children!.slice(0, 1);
    const d = diffScreens(base, edited);
    expect(d.structural).toContainEqual(expect.objectContaining({ op: 'remove', id: 'gone' }));
  });
});
