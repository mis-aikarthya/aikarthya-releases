import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ScreenModel, WidgetNode, WidgetType } from '@/model/types';
import { updateProps, removeNode, insertChild } from './treeOps';
import { defaultProps } from '@/schema/defaults';

interface EditorState {
  screen: ScreenModel | null;
  baseline: ScreenModel | null;
  selectedId: string | null;
  past: ScreenModel[];
  future: ScreenModel[];
  loadScreen: (s: ScreenModel) => void;
  select: (id: string | null) => void;
  setProp: (id: string, patch: Record<string, unknown>) => void;
  addNode: (parentId: string, type: WidgetType, index: number) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, newParentId: string, index: number) => void;
  undo: () => void;
  redo: () => void;
}

function commit(state: EditorState, next: ScreenModel): Partial<EditorState> {
  return { past: [...state.past, state.screen!], future: [], screen: next };
}

export const useEditor = create<EditorState>((set, get) => ({
  screen: null,
  baseline: null,
  selectedId: null,
  past: [],
  future: [],
  loadScreen: (s) =>
    set({ screen: structuredClone(s), baseline: structuredClone(s), past: [], future: [], selectedId: null }),
  select: (id) => set({ selectedId: id }),
  setProp: (id, patch) => {
    const st = get();
    if (!st.screen) return;
    set(commit(st, { ...st.screen, root: updateProps(st.screen.root, id, patch) }));
  },
  addNode: (parentId, type, index) => {
    const st = get();
    if (!st.screen) return;
    const node: WidgetNode = { id: nanoid(6), type, props: defaultProps(type), children: [] };
    set(commit(st, { ...st.screen, root: insertChild(st.screen.root, parentId, node, index) }));
  },
  deleteNode: (id) => {
    const st = get();
    if (!st.screen) return;
    set({ ...commit(st, { ...st.screen, root: removeNode(st.screen.root, id) }), selectedId: null });
  },
  moveNode: (id, newParentId, index) => {
    const st = get();
    if (!st.screen) return;
    let moved: WidgetNode | undefined;
    const find = (n: WidgetNode): void => {
      for (const c of n.children ?? []) { if (c.id === id) moved = c; else find(c); }
    };
    find(st.screen.root);
    if (!moved) return;
    const without = removeNode(st.screen.root, id);
    set(commit(st, { ...st.screen, root: insertChild(without, newParentId, moved, index) }));
  },
  undo: () => {
    const st = get();
    if (!st.past.length || !st.screen) return;
    const prev = st.past[st.past.length - 1];
    set({ past: st.past.slice(0, -1), future: [st.screen, ...st.future], screen: prev });
  },
  redo: () => {
    const st = get();
    if (!st.future.length || !st.screen) return;
    const next = st.future[0];
    set({ past: [...st.past, st.screen], future: st.future.slice(1), screen: next });
  },
}));
