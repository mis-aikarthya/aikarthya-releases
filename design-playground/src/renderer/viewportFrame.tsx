import type React from 'react';
import type { Viewport } from '@/model/types';

const WIDTHS: Record<Viewport, number> = { mobile: 390, tablet: 768, desktop: 1280, wide: 1600 };

export function ViewportFrame({ viewport, children }: { viewport: Viewport; children: React.ReactNode }) {
  return (
    <div style={{ width: WIDTHS[viewport], margin: '0 auto', background: '#FAFAF1',
      minHeight: 600, boxShadow: '0 0 0 1px #2e333d', overflow: 'hidden' }}>
      {children}
    </div>
  );
}
