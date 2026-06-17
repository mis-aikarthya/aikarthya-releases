import type { ScreenDiff } from './diffEngine';

export function toMarkdown(diff: ScreenDiff): string {
  const lines: string[] = [];
  lines.push(`# Changes Report — ${diff.screen}`, '');
  lines.push(`**Source Dart:** \`${escapeMd(diff.sourceDartPath)}\``, '');

  lines.push('## Property changes', '');
  if (diff.nodeChanges.length === 0) lines.push('_none_', '');
  else {
    lines.push('| Node | Property | From | To | Flutter target |');
    lines.push('|---|---|---|---|---|');
    for (const c of diff.nodeChanges) {
      lines.push(`| ${escapeMd(c.id)} (${c.type}) | ${escapeMd(c.key)} | ${escapeMd(fmt(c.from))} | ${escapeMd(fmt(c.to))} | \`${escapeMd(c.flutter)}\` |`);
    }
    lines.push('');
  }

  lines.push('## Structural changes', '');
  if (diff.structural.length === 0) lines.push('_none_', '');
  else for (const s of diff.structural) {
    lines.push(`- **${s.op}** \`${s.id}\`${s.parent ? ` → parent \`${s.parent}\`` : ''}${s.index != null ? ` @${s.index}` : ''}`);
  }
  return lines.join('\n');
}

function fmt(v: unknown): string {
  return v === undefined ? '—' : String(v);
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/`/g, "'");
}
