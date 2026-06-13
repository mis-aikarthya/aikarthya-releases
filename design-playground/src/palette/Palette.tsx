import { useEditor } from '@/store/editorStore';
import type { WidgetType } from '@/model/types';

const ITEMS: WidgetType[] = ['Container', 'Row', 'Column', 'Text', 'Icon', 'Button', 'Image', 'Input'];

export function Palette() {
  const { screen, selectedId, addNode } = useEditor();
  const parent = selectedId ?? screen?.root.id ?? null;
  return (
    <nav style={{ padding: 12 }}>
      <h4>Widgets</h4>
      {ITEMS.map((t) => (
        <button key={t} disabled={!parent}
          onClick={() => parent && addNode(parent, t, 0)}
          style={{ display: 'block', width: '100%', margin: '4px 0' }}>
          + {t}
        </button>
      ))}
    </nav>
  );
}
