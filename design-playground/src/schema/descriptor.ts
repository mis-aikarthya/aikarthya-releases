import type { WidgetType } from '@/model/types';

export type ControlType =
  | 'text' | 'number' | 'color' | 'toggle' | 'dropdown'
  | 'slider' | 'alignmentGrid' | 'paddingBox' | 'icon' | 'file' | 'url';

export interface PropDescriptor {
  key: string;
  label: string;
  group: 'Layout' | 'Style' | 'Text' | 'Actions' | 'Advanced';
  control: ControlType;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  default: unknown;
  responsive?: boolean;
  flutter: { target: string; note?: string };
}

export type WidgetSchema = PropDescriptor[];
export type SchemaTable = Partial<Record<WidgetType, WidgetSchema>>;
