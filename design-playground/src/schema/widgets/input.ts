import type { WidgetSchema } from '../descriptor';

export const inputSchema: WidgetSchema = [
  { key: 'hint', label: 'Hint text', group: 'Text', control: 'text', default: '',
    flutter: { target: 'InputDecoration.hintText' } },
  { key: 'label', label: 'Label', group: 'Text', control: 'text', default: '',
    flutter: { target: 'InputDecoration.labelText' } },
  { key: 'inputType', label: 'Type', group: 'Advanced', control: 'dropdown',
    options: ['text', 'number', 'email', 'password'], default: 'text',
    flutter: { target: 'TextField.keyboardType' } },
  { key: 'fillColor', label: 'Fill', group: 'Style', control: 'color', default: '#F4F4EB',
    flutter: { target: 'InputDecoration.fillColor' } },
  { key: 'borderRadius', label: 'Corner radius', group: 'Style', control: 'number', min: 0,
    step: 1, default: 4, flutter: { target: 'InputDecoration.border.borderRadius' } },
];
