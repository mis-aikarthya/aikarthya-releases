import type React from 'react';
import type { Theme } from '@/model/types';

const MAIN: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  spaceBetween: 'space-between', spaceAround: 'space-around', spaceEvenly: 'space-evenly',
};
const CROSS: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch',
};

export function flexStyle(direction: 'row' | 'column', p: Record<string, unknown>): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: direction,
    justifyContent: MAIN[(p.mainAxisAlignment as string) ?? 'start'],
    alignItems: CROSS[(p.crossAxisAlignment as string) ?? 'center'],
    gap: `${(p.spacing as number) ?? 0}px`,
    overflow: p.scroll ? 'auto' : 'visible',
  };
}

export function containerStyle(p: Record<string, unknown>, theme: Theme): React.CSSProperties {
  const shadowKey = (p.shadow as string) ?? 'none';
  return {
    background: (p.color as string) || undefined,
    borderRadius: `${(p.borderRadius as number) ?? 0}px`,
    border: (p.borderWidth as number) ? `${p.borderWidth}px solid ${p.borderColor}` : undefined,
    boxShadow: shadowKey !== 'none' ? theme.shadow[shadowKey] : undefined,
    padding: paddingCss(p.padding),
    margin: paddingCss(p.margin),
    width: (p.width as number) ? `${p.width}px` : undefined,
    height: (p.height as number) ? `${p.height}px` : undefined,
  };
}

export function paddingCss(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return `${v}px`;
  const o = v as { top?: number; right?: number; bottom?: number; left?: number };
  return `${o.top ?? 0}px ${o.right ?? 0}px ${o.bottom ?? 0}px ${o.left ?? 0}px`;
}
