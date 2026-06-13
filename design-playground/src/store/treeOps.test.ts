import { describe, it, expect } from 'vitest';
import { findNode, updateProps, removeNode, insertChild } from './treeOps';
import type { WidgetNode } from '@/model/types';

const tree = (): WidgetNode => ({
  id: 'root', type: 'Column', props: {},
  children: [
    { id: 'a', type: 'Text', props: { text: 'A' } },
    { id: 'b', type: 'Text', props: { text: 'B' } },
  ],
});

describe('treeOps', () => {
  it('finds a node by id', () => {
    expect(findNode(tree(), 'b')?.props.text).toBe('B');
  });
  it('updates props immutably', () => {
    const t = tree();
    const next = updateProps(t, 'a', { text: 'A2' });
    expect(findNode(next, 'a')?.props.text).toBe('A2');
    expect(findNode(t, 'a')?.props.text).toBe('A'); // original unchanged
  });
  it('removes a node', () => {
    const next = removeNode(tree(), 'a');
    expect(findNode(next, 'a')).toBeUndefined();
    expect(next.children).toHaveLength(1);
  });
  it('inserts a child at an index', () => {
    const node: WidgetNode = { id: 'c', type: 'Text', props: {} };
    const next = insertChild(tree(), 'root', node, 1);
    expect(next.children?.[1].id).toBe('c');
  });
});
