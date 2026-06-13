import { useEditor } from '@/store/editorStore';
import { diffScreens } from '@/diff/diffEngine';
import { toMarkdown } from '@/diff/reportWriter';
import type { Viewport } from '@/model/types';

const VIEWPORTS: Viewport[] = ['mobile', 'tablet', 'desktop', 'wide'];

export function TopBar({ viewport, setViewport }: { viewport: Viewport; setViewport: (v: Viewport) => void }) {
  const { screen, baseline, undo, redo } = useEditor();

  function exportReport() {
    if (!screen || !baseline) return;
    const diff = diffScreens(baseline, screen);
    const md = toMarkdown(diff);
    download('changes.json', JSON.stringify(diff, null, 2));
    download('changes.md', md);
    download('target.json', JSON.stringify(screen, null, 2));
  }

  return (
    <header style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #2e333d', alignItems: 'center' }}>
      <strong>{screen?.screenName ?? '—'}</strong>
      <span>
        {VIEWPORTS.map((v) => (
          <button key={v} onClick={() => setViewport(v)}
            style={{ fontWeight: v === viewport ? 700 : 400 }}>{v}</button>
        ))}
      </span>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <button onClick={exportReport} style={{ marginLeft: 'auto' }}>Export Changes Report</button>
    </header>
  );
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
