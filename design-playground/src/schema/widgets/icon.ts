import type { WidgetSchema } from '../descriptor';

export const iconSchema: WidgetSchema = [
  { key: 'icon', label: 'Icon', group: 'Style', control: 'icon', default: 'star',
    flutter: { target: 'Icon.icon' } },
  { key: 'size', label: 'Size', group: 'Style', control: 'number', min: 1, step: 1,
    default: 24, flutter: { target: 'Icon.size' } },
  { key: 'color', label: 'Color', group: 'Style', control: 'color', default: '#006783',
    flutter: { target: 'Icon.color' } },
];
