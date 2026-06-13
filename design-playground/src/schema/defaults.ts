import type { WidgetType } from '@/model/types';
import { getDescriptors } from './registry';

export function defaultProps(type: WidgetType): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const d of getDescriptors(type)) out[d.key] = d.default;
  return out;
}
