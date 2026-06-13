import { z } from 'zod';
import type { WidgetNode } from './types';

const hex = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'must be #RRGGBB or #AARRGGBB');

export const TextStyleTokenSchema = z.object({
  fontFamily: z.string(),
  fontSize: z.number().positive(),
  fontWeight: z.number().int().min(100).max(900),
  height: z.number().positive().optional(),
  letterSpacing: z.number().optional(),
});

export const ThemeSchema = z.object({
  colors: z.record(hex),
  typography: z.record(TextStyleTokenSchema),
  spacing: z.record(z.number()),
  radius: z.record(z.number()),
  shadow: z.record(z.string()),
  breakpoints: z.object({
    mobile: z.number(), tablet: z.number(), desktop: z.number(), wide: z.number(),
  }),
});

export const WidgetTypeSchema = z.enum([
  'Container', 'Row', 'Column', 'Stack',
  'Text', 'Image', 'Icon', 'Button', 'Input',
  'ListView', 'GridView', 'ComponentInstance',
]);

export const WidgetNodeSchema: z.ZodType<WidgetNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: WidgetTypeSchema,
    props: z.record(z.unknown()),
    children: z.array(WidgetNodeSchema).optional(),
    visibility: z.object({
      conditional: z.string().optional(),
      perViewport: z.record(z.boolean()).optional(),
    }).optional(),
    responsiveOverrides: z.record(z.record(z.unknown())).optional(),
    bindings: z.record(z.string()).optional(),
    componentRef: z.string().optional(),
    flutterHint: z.object({
      sourceFile: z.string().optional(),
      sourceLine: z.number().optional(),
    }).optional(),
  }),
);

export const ScreenModelSchema = z.object({
  screenName: z.string(),
  themeMode: z.enum(['light', 'dark']),
  root: WidgetNodeSchema,
  sourceDartPath: z.string(),
});
