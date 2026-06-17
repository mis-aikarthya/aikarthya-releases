import type React from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { WidgetNode, Theme } from '@/model/types';
import { flexStyle, containerStyle, paddingCss } from './styleMap';

interface Props { node: WidgetNode; theme: Theme; selectedId: string | null; onSelect: (id: string) => void; }

export function RenderNode({ node, theme, selectedId, onSelect }: Props): JSX.Element {
  // useDroppable must be called unconditionally (hooks rule) — every node is a valid drop target.
  const { setNodeRef, isOver } = useDroppable({ id: node.id });

  const p = node.props;
  const sel = node.id === selectedId;
  const ring: React.CSSProperties = sel
    ? { outline: '2px solid ' + (isOver ? '#FFB960' : '#62D4FF'), outlineOffset: '1px' }
    : isOver ? { outline: '2px dashed #62D4FF' } : {};
  const click = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(node.id); };
  const kids = (node.children ?? []).map((c) => (
    <RenderNode key={c.id} node={c} theme={theme} selectedId={selectedId} onSelect={onSelect} />
  ));

  switch (node.type) {
    case 'Text':
      return <span ref={setNodeRef} style={{ ...textStyle(p), ...ring }} onClick={click}>{String(p.text ?? '')}</span>;
    case 'Row':
      return <div ref={setNodeRef} style={{ ...flexStyle('row', p), ...ring }} onClick={click}>{kids}</div>;
    case 'Column':
      return <div ref={setNodeRef} style={{ ...flexStyle('column', p), ...ring }} onClick={click}>{kids}</div>;
    case 'Container':
      return <div ref={setNodeRef} style={{ ...containerStyle(p, theme), ...ring }} onClick={click}>{kids}</div>;
    case 'Icon':
      return <span ref={setNodeRef} style={{ ...ring, fontSize: `${p.size}px`, color: p.color as string }} onClick={click}>◆</span>;
    case 'Button':
      return (
        <button ref={setNodeRef} onClick={click}
          style={{ ...ring, background: p.color as string, color: p.textColor as string,
            borderRadius: `${p.borderRadius}px`, border: 'none',
            padding: `${p.paddingV}px ${p.paddingH}px` }}>
          {String(p.text ?? '')}
        </button>
      );
    case 'Image':
      return <img ref={setNodeRef} style={{ ...ring, width: (p.width as number) || undefined, height: (p.height as number) || undefined,
        objectFit: (p.fit as React.CSSProperties['objectFit']) ?? 'cover', borderRadius: `${p.borderRadius}px` }}
        src={String(p.src ?? '')} alt="" onClick={click} />;
    case 'Input':
      return <input ref={setNodeRef} placeholder={String(p.hint ?? '')} onClick={click}
        style={{ ...ring, background: p.fillColor as string, borderRadius: `${p.borderRadius}px`,
          border: 'none', padding: '12px 16px' }} />;
    case 'Stack':
      return <div ref={setNodeRef} style={{ position: 'relative', ...ring }} onClick={click}>{kids}</div>;
    case 'ListView': {
      const horizontal = p.axis === 'horizontal';
      return <div ref={setNodeRef} onClick={click}
        style={{ display: 'flex', flexDirection: horizontal ? 'row' : 'column',
          gap: `${(p.spacing as number) ?? 0}px`, overflow: 'auto', padding: paddingCss(p.padding), ...ring }}>{kids}</div>;
    }
    case 'GridView':
      return <div ref={setNodeRef} onClick={click}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${(p.crossAxisCount as number) ?? 2}, 1fr)`,
          rowGap: `${(p.mainAxisSpacing as number) ?? 8}px`, columnGap: `${(p.crossAxisSpacing as number) ?? 8}px`,
          padding: paddingCss(p.padding), ...ring }}>{kids}</div>;
    default:
      return <div ref={setNodeRef} style={ring} onClick={click}>{kids}</div>;
  }
}

function textStyle(p: Record<string, unknown>): React.CSSProperties {
  return {
    fontFamily: `'${p.fontFamily ?? 'Poppins'}', sans-serif`,
    fontSize: `${p.fontSize ?? 13}px`,
    fontWeight: Number(p.fontWeight ?? 400),
    color: (p.color as string) ?? '#1A1C17',
    letterSpacing: `${p.letterSpacing ?? 0}px`,
    lineHeight: String(p.height ?? 1.5),
    textAlign: (p.textAlign as React.CSSProperties['textAlign']) ?? 'left',
  };
}
