import { useDraggable } from '@dnd-kit/core';
import { useEditor } from '@/store/editorStore';
import type { WidgetType } from '@/model/types';

const ITEMS: WidgetType[] = ['Container', 'Row', 'Column', 'Text', 'Icon', 'Button', 'Image', 'Input'];

function PaletteItem({ t, parent }: { t: WidgetType; parent: string | null }) {
  const { addNode } = useEditor();
  const { setNodeRef, listeners, attributes } = useDraggable({
    id: 'pal-' + t,
    data: { paletteType: t },
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      disabled={!parent}
      onClick={() => parent && addNode(parent, t, 0)}
      style={{ display: 'block', width: '100%', margin: '4px 0' }}
    >
      + {t}
    </button>
  );
}

export function Palette() {
  const { screen, selectedId } = useEditor();
  const parent = selectedId ?? screen?.root.id ?? null;
  return (
    <nav style={{ padding: 12 }}>
      <h4>Widgets</h4>
      {ITEMS.map((t) => (
        <PaletteItem key={t} t={t} parent={parent} />
      ))}
    </nav>
  );
}
