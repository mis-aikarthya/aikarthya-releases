import type { WidgetSchema } from '../descriptor';

export const imageSchema: WidgetSchema = [
  { key: 'imageType', label: 'Source', group: 'Style', control: 'dropdown',
    options: ['network', 'asset'], default: 'network',
    flutter: { target: 'Image.network/Image.asset' } },
  { key: 'src', label: 'URL / asset', group: 'Style', control: 'url', default: '',
    flutter: { target: 'Image source' } },
  { key: 'fit', label: 'Fit', group: 'Style', control: 'dropdown',
    options: ['cover', 'contain', 'fill', 'fitWidth', 'fitHeight', 'none', 'scaleDown'],
    default: 'cover', flutter: { target: 'Image.fit' } },
  { key: 'width', label: 'Width', group: 'Layout', control: 'number', min: 0, step: 1,
    default: 0, flutter: { target: 'Image.width', note: '0 = auto' } },
  { key: 'height', label: 'Height', group: 'Layout', control: 'number', min: 0, step: 1,
    default: 0, flutter: { target: 'Image.height', note: '0 = auto' } },
  { key: 'borderRadius', label: 'Corner radius', group: 'Style', control: 'number', min: 0,
    step: 1, default: 0, flutter: { target: 'ClipRRect.borderRadius' } },
];
