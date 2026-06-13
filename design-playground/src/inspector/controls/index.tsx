import { HexColorInput, HexColorPicker } from 'react-colorful';
import type { PropDescriptor } from '@/schema/descriptor';

interface CProps { descriptor: PropDescriptor; value: unknown; onChange: (v: unknown) => void; }

export function Control({ descriptor, value, onChange }: CProps) {
  const d = descriptor;
  switch (d.control) {
    case 'text':
    case 'url':
      return <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" min={d.min} max={d.max} step={d.step ?? 1}
        value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} />;
    case 'toggle':
      return <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
    case 'dropdown':
      return (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {(d.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'color':
      return (
        <div>
          <HexColorPicker color={String(value ?? '#000000')} onChange={onChange} />
          <HexColorInput color={String(value ?? '#000000')} onChange={onChange} prefixed />
        </div>
      );
    case 'paddingBox':
      return <input type="number" min={0} value={Number(value ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))} />;
    case 'alignmentGrid':
    case 'icon':
    case 'file':
    case 'slider':
    default:
      return <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
  }
}
