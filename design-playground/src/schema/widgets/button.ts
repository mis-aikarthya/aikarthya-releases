import type { WidgetSchema } from '../descriptor';

export const buttonSchema: WidgetSchema = [
  { key: 'text', label: 'Label', group: 'Text', control: 'text', default: 'Button',
    flutter: { target: 'FilledButton.child(Text)' } },
  { key: 'color', label: 'Fill', group: 'Style', control: 'color', default: '#006783',
    flutter: { target: 'FilledButton.style.backgroundColor' } },
  { key: 'textColor', label: 'Text color', group: 'Style', control: 'color', default: '#FFFFFF',
    flutter: { target: 'FilledButton.style.foregroundColor' } },
  { key: 'borderRadius', label: 'Corner radius', group: 'Style', control: 'number', min: 0,
    step: 1, default: 4, flutter: { target: 'FilledButton.style.shape.borderRadius' } },
  { key: 'paddingH', label: 'Padding (horizontal)', group: 'Layout', control: 'number', min: 0,
    step: 1, default: 16, flutter: { target: 'FilledButton.style.padding.horizontal' } },
  { key: 'paddingV', label: 'Padding (vertical)', group: 'Layout', control: 'number', min: 0,
    step: 1, default: 12, flutter: { target: 'FilledButton.style.padding.vertical' } },
];
