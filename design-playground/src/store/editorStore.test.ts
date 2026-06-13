import { describe, it, expect, beforeEach } from 'vitest';
import { useEditor } from './editorStore';
import { findNode } from './treeOps';
import type { ScreenModel } from '@/model/types';

const seed: ScreenModel = {
  screenName: 'demo', themeMode: 'light', sourceDartPath: 'x.dart',
  root: { id: 'root', type: 'Column', props: {}, children: [
    { id: 'a', type: 'Text', props: { text: 'A' } },
  ] },
};

describe('editorStore', () => {
  beforeEach(() => useEditor.getState().loadScreen(seed));

  it('loads a screen and keeps a baseline', () => {
    expect(useEditor.getState().screen?.screenName).toBe('demo');
    expect(useEditor.getState().baseline?.screenName).toBe('demo');
  });
  it('setProp updates the working tree but not the baseline', () => {
    useEditor.getState().setProp('a', { text: 'A2' });
    expect(findNode(useEditor.getState().screen!.root, 'a')?.props.text).toBe('A2');
    expect(findNode(useEditor.getState().baseline!.root, 'a')?.props.text).toBe('A');
  });
  it('undo reverts the last change', () => {
    useEditor.getState().setProp('a', { text: 'A2' });
    useEditor.getState().undo();
    expect(findNode(useEditor.getState().screen!.root, 'a')?.props.text).toBe('A');
  });
});
