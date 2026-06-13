import { useState } from 'react';
import type { Viewport } from '@/model/types';
import { useEditor } from '@/store/editorStore';
import { defaultTheme } from '@/theme/defaultTheme';
import { Palette } from '@/palette/Palette';
import { WidgetTree } from '@/tree/WidgetTree';
import { Inspector } from '@/inspector/Inspector';
import { TopBar } from './TopBar';
import { RenderNode } from '@/renderer/renderNode';
import { ViewportFrame } from '@/renderer/viewportFrame';

export function Shell() {
  const [viewport, setViewport] = useState<Viewport>('mobile');
  const { screen, selectedId, select } = useEditor();

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh',
      color: '#e7e9ee', background: '#16181d', fontFamily: 'Poppins, sans-serif' }}>
      <TopBar viewport={viewport} setViewport={setViewport} />
      <div style={{ display: 'grid', gridTemplateColumns: '180px 220px 1fr 320px', overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid #2e333d', overflow: 'auto' }}><Palette /></div>
        <div style={{ borderRight: '1px solid #2e333d', overflow: 'auto' }}><WidgetTree /></div>
        <div style={{ overflow: 'auto', padding: 24 }} onClick={() => select(null)}>
          {screen && (
            <ViewportFrame viewport={viewport}>
              <RenderNode node={screen.root} theme={defaultTheme} selectedId={selectedId} onSelect={select} />
            </ViewportFrame>
          )}
        </div>
        <div style={{ borderLeft: '1px solid #2e333d', overflow: 'auto' }}><Inspector /></div>
      </div>
    </div>
  );
}
