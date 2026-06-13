import type { WidgetSchema } from '../descriptor';

export const listViewSchema: WidgetSchema = [
  { key: 'axis', label: 'Direction', group: 'Layout', control: 'dropdown',
    options: ['vertical', 'horizontal'], default: 'vertical',
    flutter: { target: 'ListView.scrollDirection' } },
  { key: 'spacing', label: 'Item spacing', group: 'Layout', control: 'number', min: 0, step: 1,
    default: 0, flutter: { target: 'ListView.separatorBuilder gap' } },
  { key: 'padding', label: 'Padding', group: 'Layout', control: 'paddingBox', default: 0,
    flutter: { target: 'ListView.padding' } },
  { key: 'reverse', label: 'Reverse', group: 'Advanced', control: 'toggle', default: false,
    flutter: { target: 'ListView.reverse' } },
];
