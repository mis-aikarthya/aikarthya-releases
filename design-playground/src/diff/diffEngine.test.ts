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
  it('detects a sibling reorder under the same parent', () => {
    const edited = structuredClone(base);
    // base children: [btn (0), gone (1)] -> swap to [gone (0), btn (1)]
    edited.root.children = [edited.root.children![1], edited.root.children![0]];
    const d = diffScreens(base, edited);
    expect(d.structural).toContainEqual(
      expect.objectContaining({ op: 'move', id: 'btn', parent: 'root', index: 1 }),
    );
  });
  it('detects a cross-parent move', () => {
    const moveBase: ScreenModel = {
      screenName: 'm', themeMode: 'light', sourceDartPath: 'm.dart',
      root: { id: 'root', type: 'Column', props: {}, children: [
        { id: 'colA', type: 'Column', props: {}, children: [
          { id: 'x', type: 'Text', props: { text: 'hi' } },
        ] },
        { id: 'colB', type: 'Column', props: {}, children: [] },
      ] },
    };
    const edited = structuredClone(moveBase);
    // move `x` from colA into colB
    edited.root.children![0].children = [];
    edited.root.children![1].children = [
      { id: 'x', type: 'Text', props: { text: 'hi' } },
    ];
    const d = diffScreens(moveBase, edited);
    expect(d.structural).toContainEqual(
      expect.objectContaining({ op: 'move', id: 'x', parent: 'colB' }),
    );
  });
  it('does not report a change for object-valued props with equal contents', () => {
    const objBase: ScreenModel = {
      screenName: 'o', themeMode: 'light', sourceDartPath: 'o.dart',
      root: { id: 'root', type: 'Container', props: { padding: { top: 8, left: 8 } } },
    };
    const edited: ScreenModel = {
      screenName: 'o', themeMode: 'light', sourceDartPath: 'o.dart',
      // separate object literal with identical contents -> reference-unequal
      root: { id: 'root', type: 'Container', props: { padding: { top: 8, left: 8 } } },
    };
    const d = diffScreens(objBase, edited);
    expect(d.nodeChanges).toHaveLength(0);
  });
});
