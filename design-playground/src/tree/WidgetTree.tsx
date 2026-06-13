import { useEditor } from '@/store/editorStore';
import type { WidgetNode } from '@/model/types';

function Row({ node, depth }: { node: WidgetNode; depth: number }) {
  const { selectedId, select, deleteNode } = useEditor();
  return (
    <div>
      <div style={{ paddingLeft: depth * 12, background: node.id === selectedId ? '#23272f' : undefined,
        display: 'flex', justifyContent: 'space-between' }}>
        <span onClick={() => select(node.id)}>{node.type}</span>
        <button onClick={() => deleteNode(node.id)}>✕</button>
      </div>
      {(node.children ?? []).map((c) => <Row key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}

export function WidgetTree() {
  const { screen } = useEditor();
  if (!screen) return null;
  return <div style={{ padding: 8 }}><Row node={screen.root} depth={0} /></div>;
}
