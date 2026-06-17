import type { WidgetSchema } from '../descriptor';

export const gridViewSchema: WidgetSchema = [
  { key: 'crossAxisCount', label: 'Columns', group: 'Layout', control: 'number', min: 1, step: 1,
    default: 2, flutter: { target: 'SliverGridDelegate.crossAxisCount' } },
  { key: 'mainAxisSpacing', label: 'Row spacing', group: 'Layout', control: 'number', min: 0, step: 1,
    default: 8, flutter: { target: 'SliverGridDelegate.mainAxisSpacing' } },
  { key: 'crossAxisSpacing', label: 'Column spacing', group: 'Layout', control: 'number', min: 0, step: 1,
    default: 8, flutter: { target: 'SliverGridDelegate.crossAxisSpacing' } },
  { key: 'childAspectRatio', label: 'Aspect ratio', group: 'Layout', control: 'number', min: 0.1, step: 0.1,
    default: 1, flutter: { target: 'SliverGridDelegate.childAspectRatio' } },
  { key: 'padding', label: 'Padding', group: 'Layout', control: 'paddingBox', default: 0,
    flutter: { target: 'GridView.padding' } },
];
