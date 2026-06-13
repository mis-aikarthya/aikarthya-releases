import type { ScreenModel, WidgetNode } from '@/model/types';
import { getDescriptor } from '@/schema/registry';

export interface NodeChange {
  id: string; type: WidgetNode['type']; key: string;
  from: unknown; to: unknown; flutter: string;
}
export interface StructuralChange {
  op: 'add' | 'remove' | 'move'; id: string; parent?: string; index?: number;
}
export interface ScreenDiff {
  screen: string; sourceDartPath: string;
  nodeChanges: NodeChange[]; structural: StructuralChange[];
}

interface FlatEntry { node: WidgetNode; parent: string | null; index: number; }

function flatten(node: WidgetNode, parent: string | null, index: number, out: Map<string, FlatEntry>): void {
  out.set(node.id, { node, parent, index });
  (node.children ?? []).forEach((c, i) => flatten(c, node.id, i, out));
}

export function diffScreens(base: ScreenModel, edited: ScreenModel): ScreenDiff {
  const baseMap = new Map<string, FlatEntry>();
  const editMap = new Map<string, FlatEntry>();
  flatten(base.root, null, 0, baseMap);
  flatten(edited.root, null, 0, editMap);

  const nodeChanges: NodeChange[] = [];
  const structural: StructuralChange[] = [];

  for (const [id, { node }] of editMap) {
    const cur = editMap.get(id)!;
    const prev = baseMap.get(id);
    if (!prev) {
      // NOTE: a node that moved out of a since-deleted parent is reported as 'add', not 'move' (accepted limitation).
      structural.push({ op: 'add', id, parent: cur.parent ?? undefined, index: cur.index });
      continue;
    }
    if (prev.parent !== cur.parent || prev.index !== cur.index) {
      // Parent changed, or same parent but position changed (sibling reorder).
      structural.push({ op: 'move', id, parent: cur.parent ?? undefined, index: cur.index });
    }
    const keys = new Set([...Object.keys(prev.node.props), ...Object.keys(node.props)]);
    for (const key of keys) {
      if (prev.node.props[key] !== node.props[key]) {
        nodeChanges.push({
          id, type: node.type, key,
          from: prev.node.props[key], to: node.props[key],
          flutter: getDescriptor(node.type, key)?.flutter.target ?? '(unmapped)',
        });
      }
    }
  }
  for (const [id] of baseMap) {
    if (!editMap.has(id)) structural.push({ op: 'remove', id });
  }
  return { screen: edited.screenName, sourceDartPath: edited.sourceDartPath, nodeChanges, structural };
}
