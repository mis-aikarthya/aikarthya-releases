import { describe, it, expect, beforeEach } from 'vitest';
import { useEditor } from './editorStore';
import { findNode } from './treeOps';
import { defaultProps } from '@/schema/defaults';
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
  it('redo re-applies an undone change', () => {
    useEditor.getState().setProp('a', { text: 'A2' });
    useEditor.getState().undo();
    useEditor.getState().redo();
    expect(findNode(useEditor.getState().screen!.root, 'a')?.props.text).toBe('A2');
  });
  it('deleteNode removes a child but root delete is a no-op', () => {
    useEditor.getState().deleteNode('a');
    expect(findNode(useEditor.getState().screen!.root, 'a')).toBeUndefined();
    useEditor.getState().deleteNode('root');
    expect(useEditor.getState().screen!.root.id).toBe('root');
  });
  it('addNode appends a node with default props and no children key for leaves', () => {
    const before = useEditor.getState().screen!.root.children!.length;
    useEditor.getState().addNode('root', 'Text', before);
    const children = useEditor.getState().screen!.root.children!;
    expect(children).toHaveLength(before + 1);
    const added = children[before];
    expect(added.type).toBe('Text');
    expect(added.props).toEqual(defaultProps('Text'));
    expect('children' in added).toBe(false);
  });
  it('moveNode moves a node into a sibling container', () => {
    const nested: ScreenModel = {
      screenName: 'nest', themeMode: 'light', sourceDartPath: 'x.dart',
      root: { id: 'root', type: 'Column', props: {}, children: [
        { id: 'colX', type: 'Column', props: {}, children: [
          { id: 'a', type: 'Text', props: { text: 'A' } },
        ] },
        { id: 'colY', type: 'Column', props: {}, children: [] },
      ] },
    };
    useEditor.getState().loadScreen(nested);
    useEditor.getState().moveNode('a', 'colY', 0);
    const root = useEditor.getState().screen!.root;
    expect(findNode(root, 'colX')?.children).toHaveLength(0);
    expect(findNode(root, 'colY')?.children?.[0].id).toBe('a');
  });
  it('moveNode into its own descendant is a no-op and does not lose the node', () => {
    const nested: ScreenModel = {
      screenName: 'nest', themeMode: 'light', sourceDartPath: 'x.dart',
      root: { id: 'root', type: 'Column', props: {}, children: [
        { id: 'parent', type: 'Column', props: {}, children: [
          { id: 'child', type: 'Column', props: {}, children: [] },
        ] },
      ] },
    };
    useEditor.getState().loadScreen(nested);
    useEditor.getState().moveNode('parent', 'child', 0);
    const root = useEditor.getState().screen!.root;
    expect(findNode(root, 'parent')).toBeDefined();
    expect(findNode(root, 'parent')?.children?.[0].id).toBe('child');
  });
});
