import type { WidgetNode } from '@/model/types';

export function findNode(node: WidgetNode, id: string): WidgetNode | undefined {
  if (node.id === id) return node;
  for (const c of node.children ?? []) {
    const found = findNode(c, id);
    if (found) return found;
  }
  return undefined;
}

export function updateProps(node: WidgetNode, id: string, patch: Record<string, unknown>): WidgetNode {
  if (node.id === id) return { ...node, props: { ...node.props, ...patch } };
  if (!node.children) return node;
  return { ...node, children: node.children.map((c) => updateProps(c, id, patch)) };
}

export function removeNode(node: WidgetNode, id: string): WidgetNode {
  if (!node.children) return node;
  return {
    ...node,
    children: node.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
  };
}

export function insertChild(node: WidgetNode, parentId: string, child: WidgetNode, index: number): WidgetNode {
  if (node.id === parentId) {
    const children = [...(node.children ?? [])];
    const safeIndex = Math.max(0, Math.min(index, children.length));
    children.splice(safeIndex, 0, child);
    return { ...node, children };
  }
  if (!node.children) return node;
  return { ...node, children: node.children.map((c) => insertChild(c, parentId, child, index)) };
}
