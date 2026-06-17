import type { WidgetSchema } from '../descriptor';

export const flexSchema: WidgetSchema = [
  { key: 'mainAxisAlignment', label: 'Main axis', group: 'Layout', control: 'dropdown',
    options: ['start', 'center', 'end', 'spaceBetween', 'spaceAround', 'spaceEvenly'],
    default: 'start', flutter: { target: 'Flex.mainAxisAlignment' } },
  { key: 'crossAxisAlignment', label: 'Cross axis', group: 'Layout', control: 'dropdown',
    options: ['start', 'center', 'end', 'stretch'], default: 'center',
    flutter: { target: 'Flex.crossAxisAlignment' } },
  { key: 'spacing', label: 'Spacing', group: 'Layout', control: 'number', min: 0, step: 1,
    default: 0, flutter: { target: 'Flex.spacing', note: 'SizedBox between children' } },
  { key: 'scroll', label: 'Allow scrolling', group: 'Layout', control: 'toggle', default: false,
    flutter: { target: 'SingleChildScrollView', note: 'wraps when true' } },
];
