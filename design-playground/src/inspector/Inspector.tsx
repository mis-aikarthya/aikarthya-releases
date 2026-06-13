import { useEditor } from '@/store/editorStore';
import { findNode } from '@/store/treeOps';
import { getDescriptors } from '@/schema/registry';
import { Control } from './controls';

export function Inspector() {
  const { screen, selectedId, setProp } = useEditor();
  if (!screen || !selectedId) return <aside style={{ padding: 16 }}>Select a widget</aside>;
  const node = findNode(screen.root, selectedId);
  if (!node) return <aside style={{ padding: 16 }}>—</aside>;
  const descriptors = getDescriptors(node.type);

  return (
    <aside style={{ padding: 16, overflow: 'auto' }}>
      <h3>{node.type} <small>{node.id}</small></h3>
      {descriptors.map((d) => (
        <label key={d.key} style={{ display: 'block', margin: '8px 0' }}>
          <span style={{ display: 'block', fontSize: 12, color: '#9aa1ad' }}>{d.label}</span>
          <Control descriptor={d} value={node.props[d.key]}
            onChange={(v) => setProp(node.id, { [d.key]: v })} />
        </label>
      ))}
    </aside>
  );
}
