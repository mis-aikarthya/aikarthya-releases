import type { WidgetSchema } from '../descriptor';

export const stackSchema: WidgetSchema = [
  { key: 'alignment', label: 'Alignment', group: 'Layout', control: 'alignmentGrid',
    default: 'topLeft', flutter: { target: 'Stack.alignment' } },
];
