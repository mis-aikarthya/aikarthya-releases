import type React from 'react';
import type { WidgetNode, Theme } from '@/model/types';
import { flexStyle, containerStyle } from './styleMap';

interface Props { node: WidgetNode; theme: Theme; selectedId: string | null; onSelect: (id: string) => void; }

export function RenderNode({ node, theme, selectedId, onSelect }: Props): JSX.Element {
  const p = node.props;
  const sel = node.id === selectedId;
  const ring: React.CSSProperties = sel ? { outline: '2px solid #62D4FF', outlineOffset: '1px' } : {};
  const click = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(node.id); };
  const kids = (node.children ?? []).map((c) => (
    <RenderNode key={c.id} node={c} theme={theme} selectedId={selectedId} onSelect={onSelect} />
  ));

  switch (node.type) {
    case 'Text':
      return <span style={{ ...textStyle(p), ...ring }} onClick={click}>{String(p.text ?? '')}</span>;
    case 'Row':
      return <div style={{ ...flexStyle('row', p), ...ring }} onClick={click}>{kids}</div>;
    case 'Column':
      return <div style={{ ...flexStyle('column', p), ...ring }} onClick={click}>{kids}</div>;
    case 'Container':
      return <div style={{ ...containerStyle(p, theme), ...ring }} onClick={click}>{kids}</div>;
    case 'Icon':
      return <span style={{ ...ring, fontSize: `${p.size}px`, color: p.color as string }} onClick={click}>◆</span>;
    case 'Button':
      return (
        <button onClick={click}
          style={{ ...ring, background: p.color as string, color: p.textColor as string,
            borderRadius: `${p.borderRadius}px`, border: 'none',
            padding: `${p.paddingV}px ${p.paddingH}px` }}>
          {String(p.text ?? '')}
        </button>
      );
    case 'Image':
      return <img style={{ ...ring, width: (p.width as number) || undefined, height: (p.height as number) || undefined,
        objectFit: (p.fit as React.CSSProperties['objectFit']) ?? 'cover', borderRadius: `${p.borderRadius}px` }}
        src={String(p.src ?? '')} alt="" onClick={click} />;
    case 'Input':
      return <input placeholder={String(p.hint ?? '')} onClick={click}
        style={{ ...ring, background: p.fillColor as string, borderRadius: `${p.borderRadius}px`,
          border: 'none', padding: '12px 16px' }} />;
    default:
      return <div style={ring} onClick={click}>{kids}</div>;
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
