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

function flatten(node: WidgetNode, parent: string | null, out: Map<string, { node: WidgetNode; parent: string | null }>): void {
  out.set(node.id, { node, parent });
  (node.children ?? []).forEach((c) => flatten(c, node.id, out));
}

export function diffScreens(base: ScreenModel, edited: ScreenModel): ScreenDiff {
  const baseMap = new Map<string, { node: WidgetNode; parent: string | null }>();
  const editMap = new Map<string, { node: WidgetNode; parent: string | null }>();
  flatten(base.root, null, baseMap);
  flatten(edited.root, null, editMap);

  const nodeChanges: NodeChange[] = [];
  const structural: StructuralChange[] = [];

  for (const [id, { node }] of editMap) {
    const prev = baseMap.get(id);
    if (!prev) { structural.push({ op: 'add', id, parent: editMap.get(id)!.parent ?? undefined }); continue; }
    if (prev.parent !== editMap.get(id)!.parent) {
      structural.push({ op: 'move', id, parent: editMap.get(id)!.parent ?? undefined });
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
