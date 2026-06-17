# Aikarthya Design Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based visual design studio at `design-playground/` that lets the user redesign the app's screens (drag-drop, inspector, theme tokens) and export a Changes Report that Claude applies back to Flutter Dart; seed and prove the loop on the Profile screen.

**Architecture:** React + TypeScript + Vite single-page app, no backend. A pure data core (`model/`, `schema/`, `store/`, `diff/`, `theme-editor/` generator) is unit-tested with vitest; UI modules (`renderer/`, `canvas/`, `palette/`, `inspector/`, `tree/`, `app/`) render the model and are verified in the dev server. Screens are seeded as `ScreenModel` JSON translated from Dart by Claude. Export diffs the edited tree against the seeded baseline into a Changes Report bundle.

**Tech Stack:** React 18, TypeScript, Vite, vitest, zustand (+ undo/redo), dnd-kit, react-colorful, zod.

**Reference spec:** `design-playground/docs/2026-06-13-design-studio-design.md`

---

## File Structure

```
design-playground/
  package.json  vite.config.ts  tsconfig.json  index.html  vitest.config.ts
  src/
    main.tsx  App.tsx
    model/        types.ts  schemas.ts  index.ts
    schema/       descriptor.ts  widgets/<type>.ts  registry.ts  index.ts
    store/        editorStore.ts  history.ts
    theme/        defaultTheme.ts  dartGenerator.ts
    diff/         diffEngine.ts  reportWriter.ts
    renderer/     renderNode.tsx  viewportFrame.tsx
    palette/      Palette.tsx  paletteItems.ts
    canvas/       Canvas.tsx  SelectionOverlay.tsx
    inspector/    Inspector.tsx  controls/<Control>.tsx
    tree/         WidgetTree.tsx
    app/          Shell.tsx  TopBar.tsx
  screens/        profile.json            (seeded baseline)
  exports/        <generated bundles>
  docs/           (spec + this plan)
  __tests__/      (co-located *.test.ts preferred; this holds cross-module tests)
```

Each module has one responsibility. `model/` is depended on by everything and depends on nothing. `schema/` depends only on `model/`. UI depends on `store/`, `renderer/`, `schema/`. No circular imports.

---

## Milestone 0 — Project setup & git

### Task 0.1: Initialise git at the repo root

**Files:**
- Create: `.gitignore` (repo root)

- [ ] **Step 1: Init repo at root**

Run from `C:\Users\KIIT0001\Desktop\Aikarthya-field-ops`:
```bash
git init
```
Expected: "Initialized empty Git repository". Note: `aikarthya-field-ops-app/` already has its own `.git`; that nested repo is left as-is (it will appear as an untracked directory / gitlink — do not add its internals).

- [ ] **Step 2: Create root `.gitignore`**

Create `.gitignore` at the repo root:
```gitignore
# Node / Vite (design-playground)
design-playground/node_modules/
design-playground/dist/
design-playground/.vite/
design-playground/exports/

# OS / editor
.DS_Store
Thumbs.db

# Nested Flutter app keeps its own repo
aikarthya-field-ops-app/
```

- [ ] **Step 3: First commit**

```bash
git add .gitignore design-playground/docs
git commit -m "chore: init root repo with design studio spec and plan"
```
Expected: a commit is created listing `.gitignore` and the two docs.

---

### Task 0.2: Scaffold the Vite + React + TS app

**Files:**
- Create: `design-playground/package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `vitest.config.ts`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Create `design-playground/package.json`**

```json
{
  "name": "aikarthya-design-studio",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.5",
    "zod": "^3.23.8",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "react-colorful": "^5.6.1",
    "nanoid": "^5.0.7"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.4",
    "vite": "^5.4.2",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Create `design-playground/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "screens"]
}
```

- [ ] **Step 3: Create `design-playground/vite.config.ts`**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});
```

- [ ] **Step 4: Create `design-playground/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
```

- [ ] **Step 5: Create `design-playground/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Aikarthya Design Studio</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Create `design-playground/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 7: Create placeholder `design-playground/src/App.tsx`**

```tsx
export default function App() {
  return <div>Aikarthya Design Studio — booting…</div>;
}
```

- [ ] **Step 8: Install dependencies**

Run in `design-playground/`:
```bash
npm install
```
Expected: `node_modules/` created, no peer-dependency errors that block install.

- [ ] **Step 9: Verify dev server boots**

Run in `design-playground/`:
```bash
npm run dev
```
Expected: Vite prints a Local URL (e.g. `http://localhost:5173`). Open it; the placeholder text renders. Stop the server (Ctrl+C).

- [ ] **Step 10: Commit**

```bash
git add design-playground/package.json design-playground/tsconfig.json design-playground/vite.config.ts design-playground/vitest.config.ts design-playground/index.html design-playground/src/main.tsx design-playground/src/App.tsx design-playground/package-lock.json
git commit -m "chore: scaffold Vite + React + TS design studio"
```

---

## Milestone 1 — Data model (TDD)

### Task 1.1: Theme model + validation

**Files:**
- Create: `design-playground/src/model/types.ts`
- Create: `design-playground/src/model/schemas.ts`
- Test: `design-playground/src/model/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

`src/model/schemas.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { ThemeSchema } from './schemas';

describe('ThemeSchema', () => {
  it('accepts a minimal valid theme', () => {
    const theme = {
      colors: { primary: '#006783' },
      typography: { bodyMedium: { fontFamily: 'Poppins', fontSize: 13, fontWeight: 400 } },
      spacing: { md: 16 },
      radius: { sm: 4 },
      shadow: { low: '0 2px 8px rgba(0,0,0,0.08)' },
      breakpoints: { mobile: 600, tablet: 1024, desktop: 1440, wide: 1920 },
    };
    expect(ThemeSchema.parse(theme)).toEqual(theme);
  });

  it('rejects a non-hex color', () => {
    const bad = {
      colors: { primary: 'teal' },
      typography: {}, spacing: {}, radius: {}, shadow: {},
      breakpoints: { mobile: 600, tablet: 1024, desktop: 1440, wide: 1920 },
    };
    expect(() => ThemeSchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run in `design-playground/`: `npx vitest run src/model/schemas.test.ts`
Expected: FAIL — `Cannot find module './schemas'`.

- [ ] **Step 3: Write `src/model/types.ts`**

```ts
export type Viewport = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  height?: number;
  letterSpacing?: number;
}

export interface Theme {
  colors: Record<string, string>;
  typography: Record<string, TextStyleToken>;
  spacing: Record<string, number>;
  radius: Record<string, number>;
  shadow: Record<string, string>;
  breakpoints: { mobile: number; tablet: number; desktop: number; wide: number };
}

export type WidgetType =
  | 'Container' | 'Row' | 'Column' | 'Stack'
  | 'Text' | 'Image' | 'Icon' | 'Button' | 'Input'
  | 'ListView' | 'GridView' | 'ComponentInstance';

export interface WidgetNode {
  id: string;
  type: WidgetType;
  props: Record<string, unknown>;
  children?: WidgetNode[];
  visibility?: {
    conditional?: string;
    perViewport?: Partial<Record<Viewport, boolean>>;
  };
  responsiveOverrides?: Partial<Record<Viewport, Record<string, unknown>>>;
  bindings?: Record<string, string>;
  componentRef?: string;
  flutterHint?: { sourceFile?: string; sourceLine?: number };
}

export interface ScreenModel {
  screenName: string;
  themeMode: 'light' | 'dark';
  root: WidgetNode;
  sourceDartPath: string;
}

export interface ComponentDef {
  name: string;
  props: Record<string, { type: string; default: unknown }>;
  widgetTree: WidgetNode;
}

export interface Project {
  theme: Theme;
  screens: ScreenModel[];
  components: ComponentDef[];
}
```

- [ ] **Step 4: Write `src/model/schemas.ts`**

```ts
import { z } from 'zod';

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

export const WidgetNodeSchema: z.ZodType<import('./types').WidgetNode> = z.lazy(() =>
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/model/schemas.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Create barrel `src/model/index.ts`**

```ts
export * from './types';
export * from './schemas';
```

- [ ] **Step 7: Commit**

```bash
git add design-playground/src/model
git commit -m "feat(model): theme + widget node types with zod validation"
```

---

### Task 1.2: ScreenModel round-trip test

**Files:**
- Test: `design-playground/src/model/screenModel.test.ts`

- [ ] **Step 1: Write the failing test**

`src/model/screenModel.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { ScreenModelSchema } from './schemas';

describe('ScreenModelSchema', () => {
  it('validates a nested tree', () => {
    const screen = {
      screenName: 'demo',
      themeMode: 'light' as const,
      sourceDartPath: 'lib/x.dart',
      root: {
        id: 'r', type: 'Column', props: {},
        children: [{ id: 't', type: 'Text', props: { text: 'hi' } }],
      },
    };
    expect(ScreenModelSchema.parse(screen).root.children?.[0].type).toBe('Text');
  });
});
```

- [ ] **Step 2: Run to verify it passes**

Run: `npx vitest run src/model/screenModel.test.ts`
Expected: PASS (the recursive `WidgetNodeSchema` already supports this; this test guards regressions).

- [ ] **Step 3: Commit**

```bash
git add design-playground/src/model/screenModel.test.ts
git commit -m "test(model): guard nested screen model validation"
```

---

## Milestone 2 — Widget property schema registry (TDD)

The registry encodes the research report §4 inspector tables as data. The inspector, validation, and Flutter mapping all read from it.

### Task 2.1: Descriptor type + registry lookup

**Files:**
- Create: `design-playground/src/schema/descriptor.ts`
- Create: `design-playground/src/schema/registry.ts`
- Test: `design-playground/src/schema/registry.test.ts`

- [ ] **Step 1: Write the failing test**

`src/schema/registry.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { getDescriptors, getDescriptor } from './registry';

describe('registry', () => {
  it('returns descriptors for Text including a text content control', () => {
    const ds = getDescriptors('Text');
    expect(ds.find((d) => d.key === 'text')?.control).toBe('text');
  });
  it('looks up a single descriptor by widget+key', () => {
    expect(getDescriptor('Text', 'fontSize')?.control).toBe('number');
  });
  it('returns [] for an unknown widget', () => {
    expect(getDescriptors('Nope' as never)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/schema/registry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/schema/descriptor.ts`**

```ts
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
```

- [ ] **Step 4: Write `src/schema/registry.ts`**

```ts
import type { WidgetType } from '@/model/types';
import type { PropDescriptor, SchemaTable } from './descriptor';
import { textSchema } from './widgets/text';
import { containerSchema } from './widgets/container';
import { flexSchema } from './widgets/flex';
import { iconSchema } from './widgets/icon';
import { buttonSchema } from './widgets/button';
import { imageSchema } from './widgets/image';
import { inputSchema } from './widgets/input';

const TABLE: SchemaTable = {
  Text: textSchema,
  Container: containerSchema,
  Row: flexSchema,
  Column: flexSchema,
  Icon: iconSchema,
  Button: buttonSchema,
  Image: imageSchema,
  Input: inputSchema,
};

export function getDescriptors(type: WidgetType): PropDescriptor[] {
  return TABLE[type] ?? [];
}

export function getDescriptor(type: WidgetType, key: string): PropDescriptor | undefined {
  return getDescriptors(type).find((d) => d.key === key);
}
```

- [ ] **Step 5: Create the widget schema files**

`src/schema/widgets/text.ts`:
```ts
import type { WidgetSchema } from '../descriptor';

export const textSchema: WidgetSchema = [
  { key: 'text', label: 'Text', group: 'Text', control: 'text', default: '',
    flutter: { target: 'Text.data' } },
  { key: 'fontFamily', label: 'Font', group: 'Text', control: 'dropdown',
    options: ['Poppins', 'Montserrat'], default: 'Poppins',
    flutter: { target: 'TextStyle.fontFamily' } },
  { key: 'fontSize', label: 'Size', group: 'Text', control: 'number', min: 1, step: 1,
    default: 13, responsive: true, flutter: { target: 'TextStyle.fontSize' } },
  { key: 'fontWeight', label: 'Weight', group: 'Text', control: 'dropdown',
    options: ['400', '500', '600', '700', '800'], default: '400',
    flutter: { target: 'TextStyle.fontWeight' } },
  { key: 'color', label: 'Color', group: 'Text', control: 'color', default: '#1A1C17',
    flutter: { target: 'TextStyle.color' } },
  { key: 'letterSpacing', label: 'Letter spacing', group: 'Text', control: 'number',
    step: 0.1, default: 0, flutter: { target: 'TextStyle.letterSpacing' } },
  { key: 'height', label: 'Line height', group: 'Text', control: 'number', min: 0.8,
    step: 0.05, default: 1.5, flutter: { target: 'TextStyle.height' } },
  { key: 'textAlign', label: 'Align', group: 'Text', control: 'dropdown',
    options: ['left', 'center', 'right', 'justify'], default: 'left',
    flutter: { target: 'Text.textAlign' } },
  { key: 'maxLines', label: 'Max lines', group: 'Text', control: 'number', min: 1, step: 1,
    default: 0, flutter: { target: 'Text.maxLines', note: '0 = unlimited' } },
];
```

`src/schema/widgets/container.ts`:
```ts
import type { WidgetSchema } from '../descriptor';

export const containerSchema: WidgetSchema = [
  { key: 'color', label: 'Background', group: 'Style', control: 'color', default: '#FFFFFF',
    flutter: { target: 'Container.decoration.color' } },
  { key: 'borderRadius', label: 'Corner radius', group: 'Style', control: 'number', min: 0,
    step: 1, default: 0, flutter: { target: 'BoxDecoration.borderRadius' } },
  { key: 'borderColor', label: 'Border color', group: 'Style', control: 'color',
    default: '#00000000', flutter: { target: 'Border.all.color' } },
  { key: 'borderWidth', label: 'Border width', group: 'Style', control: 'number', min: 0,
    step: 1, default: 0, flutter: { target: 'Border.all.width' } },
  { key: 'shadow', label: 'Shadow', group: 'Style', control: 'dropdown',
    options: ['none', 'low', 'medium', 'high'], default: 'none',
    flutter: { target: 'BoxDecoration.boxShadow' } },
  { key: 'padding', label: 'Padding', group: 'Layout', control: 'paddingBox', default: 0,
    flutter: { target: 'Container.padding' } },
  { key: 'margin', label: 'Margin', group: 'Layout', control: 'paddingBox', default: 0,
    flutter: { target: 'Container.margin' } },
  { key: 'width', label: 'Width', group: 'Layout', control: 'number', min: 0, step: 1,
    default: 0, responsive: true, flutter: { target: 'Container.width', note: '0 = auto' } },
  { key: 'height', label: 'Height', group: 'Layout', control: 'number', min: 0, step: 1,
    default: 0, responsive: true, flutter: { target: 'Container.height', note: '0 = auto' } },
  { key: 'alignment', label: 'Align child', group: 'Layout', control: 'alignmentGrid',
    default: 'topLeft', flutter: { target: 'Container.alignment' } },
];
```

`src/schema/widgets/flex.ts` (shared by Row and Column):
```ts
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
```

`src/schema/widgets/icon.ts`:
```ts
import type { WidgetSchema } from '../descriptor';

export const iconSchema: WidgetSchema = [
  { key: 'icon', label: 'Icon', group: 'Style', control: 'icon', default: 'star',
    flutter: { target: 'Icon.icon' } },
  { key: 'size', label: 'Size', group: 'Style', control: 'number', min: 1, step: 1,
    default: 24, flutter: { target: 'Icon.size' } },
  { key: 'color', label: 'Color', group: 'Style', control: 'color', default: '#006783',
    flutter: { target: 'Icon.color' } },
];
```

`src/schema/widgets/button.ts`:
```ts
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
```

`src/schema/widgets/image.ts`:
```ts
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
```

`src/schema/widgets/input.ts`:
```ts
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
```

- [ ] **Step 6: Run to verify it passes**

Run: `npx vitest run src/schema/registry.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Create barrel `src/schema/index.ts`**

```ts
export * from './descriptor';
export * from './registry';
```

- [ ] **Step 8: Commit**

```bash
git add design-playground/src/schema
git commit -m "feat(schema): widget property descriptor registry"
```

---

### Task 2.2: Default-props helper

**Files:**
- Create: `design-playground/src/schema/defaults.ts`
- Test: `design-playground/src/schema/defaults.test.ts`

- [ ] **Step 1: Write the failing test**

`src/schema/defaults.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { defaultProps } from './defaults';

describe('defaultProps', () => {
  it('builds a props object from descriptor defaults', () => {
    const p = defaultProps('Text');
    expect(p.text).toBe('');
    expect(p.fontSize).toBe(13);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/schema/defaults.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/schema/defaults.ts`**

```ts
import type { WidgetType } from '@/model/types';
import { getDescriptors } from './registry';

export function defaultProps(type: WidgetType): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const d of getDescriptors(type)) out[d.key] = d.default;
  return out;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/schema/defaults.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add design-playground/src/schema/defaults.ts design-playground/src/schema/defaults.test.ts
git commit -m "feat(schema): default props from descriptors"
```

---

## Milestone 3 — Editor store (TDD)

### Task 3.1: Tree mutation helpers (pure)

**Files:**
- Create: `design-playground/src/store/treeOps.ts`
- Test: `design-playground/src/store/treeOps.test.ts`

- [ ] **Step 1: Write the failing test**

`src/store/treeOps.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { findNode, updateProps, removeNode, insertChild } from './treeOps';
import type { WidgetNode } from '@/model/types';

const tree = (): WidgetNode => ({
  id: 'root', type: 'Column', props: {},
  children: [
    { id: 'a', type: 'Text', props: { text: 'A' } },
    { id: 'b', type: 'Text', props: { text: 'B' } },
  ],
});

describe('treeOps', () => {
  it('finds a node by id', () => {
    expect(findNode(tree(), 'b')?.props.text).toBe('B');
  });
  it('updates props immutably', () => {
    const t = tree();
    const next = updateProps(t, 'a', { text: 'A2' });
    expect(findNode(next, 'a')?.props.text).toBe('A2');
    expect(findNode(t, 'a')?.props.text).toBe('A'); // original unchanged
  });
  it('removes a node', () => {
    const next = removeNode(tree(), 'a');
    expect(findNode(next, 'a')).toBeUndefined();
    expect(next.children).toHaveLength(1);
  });
  it('inserts a child at an index', () => {
    const node: WidgetNode = { id: 'c', type: 'Text', props: {} };
    const next = insertChild(tree(), 'root', node, 1);
    expect(next.children?.[1].id).toBe('c');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/store/treeOps.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/store/treeOps.ts`**

```ts
import type { WidgetNode } from '@/model/types';

export function findNode(node: WidgetNode, id: string): WidgetNode | undefined {
  if (node.id === id) return node;
  for (const c of node.children ?? []) {
    const found = findNode(c, id);
    if (found) return found;
  }
  return undefined;
}

export function updateProps(node: WidgetNode, id: string, patch: Record<string, unknown>): WidgetNode {
  if (node.id === id) return { ...node, props: { ...node.props, ...patch } };
  if (!node.children) return node;
  return { ...node, children: node.children.map((c) => updateProps(c, id, patch)) };
}

export function removeNode(node: WidgetNode, id: string): WidgetNode {
  if (!node.children) return node;
  return {
    ...node,
    children: node.children.filter((c) => c.id !== id).map((c) => removeNode(c, id)),
  };
}

export function insertChild(node: WidgetNode, parentId: string, child: WidgetNode, index: number): WidgetNode {
  if (node.id === parentId) {
    const children = [...(node.children ?? [])];
    children.splice(index, 0, child);
    return { ...node, children };
  }
  if (!node.children) return node;
  return { ...node, children: node.children.map((c) => insertChild(c, parentId, child, index)) };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/store/treeOps.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add design-playground/src/store/treeOps.ts design-playground/src/store/treeOps.test.ts
git commit -m "feat(store): immutable tree mutation helpers"
```

---

### Task 3.2: zustand editor store with undo/redo

**Files:**
- Create: `design-playground/src/store/editorStore.ts`
- Test: `design-playground/src/store/editorStore.test.ts`

- [ ] **Step 1: Write the failing test**

`src/store/editorStore.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useEditor } from './editorStore';
import { findNode } from './treeOps';
import type { ScreenModel } from '@/model/types';

const seed: ScreenModel = {
  screenName: 'demo', themeMode: 'light', sourceDartPath: 'x.dart',
  root: { id: 'root', type: 'Column', props: {}, children: [
    { id: 'a', type: 'Text', props: { text: 'A' } },
  ] },
};

describe('editorStore', () => {
  beforeEach(() => useEditor.getState().loadScreen(seed));

  it('loads a screen and keeps a baseline', () => {
    expect(useEditor.getState().screen?.screenName).toBe('demo');
    expect(useEditor.getState().baseline?.screenName).toBe('demo');
  });
  it('setProp updates the working tree but not the baseline', () => {
    useEditor.getState().setProp('a', { text: 'A2' });
    expect(findNode(useEditor.getState().screen!.root, 'a')?.props.text).toBe('A2');
    expect(findNode(useEditor.getState().baseline!.root, 'a')?.props.text).toBe('A');
  });
  it('undo reverts the last change', () => {
    useEditor.getState().setProp('a', { text: 'A2' });
    useEditor.getState().undo();
    expect(findNode(useEditor.getState().screen!.root, 'a')?.props.text).toBe('A');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/store/editorStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/store/editorStore.ts`**

```ts
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { ScreenModel, WidgetNode, WidgetType } from '@/model/types';
import { updateProps, removeNode, insertChild } from './treeOps';
import { defaultProps } from '@/schema/defaults';

interface EditorState {
  screen: ScreenModel | null;
  baseline: ScreenModel | null;
  selectedId: string | null;
  past: ScreenModel[];
  future: ScreenModel[];
  loadScreen: (s: ScreenModel) => void;
  select: (id: string | null) => void;
  setProp: (id: string, patch: Record<string, unknown>) => void;
  addNode: (parentId: string, type: WidgetType, index: number) => void;
  deleteNode: (id: string) => void;
  moveNode: (id: string, newParentId: string, index: number) => void;
  undo: () => void;
  redo: () => void;
}

function commit(state: EditorState, next: ScreenModel): Partial<EditorState> {
  return { past: [...state.past, state.screen!], future: [], screen: next };
}

export const useEditor = create<EditorState>((set, get) => ({
  screen: null,
  baseline: null,
  selectedId: null,
  past: [],
  future: [],
  loadScreen: (s) =>
    set({ screen: structuredClone(s), baseline: structuredClone(s), past: [], future: [], selectedId: null }),
  select: (id) => set({ selectedId: id }),
  setProp: (id, patch) => {
    const st = get();
    if (!st.screen) return;
    set(commit(st, { ...st.screen, root: updateProps(st.screen.root, id, patch) }));
  },
  addNode: (parentId, type, index) => {
    const st = get();
    if (!st.screen) return;
    const node: WidgetNode = { id: nanoid(6), type, props: defaultProps(type), children: [] };
    set(commit(st, { ...st.screen, root: insertChild(st.screen.root, parentId, node, index) }));
  },
  deleteNode: (id) => {
    const st = get();
    if (!st.screen) return;
    set({ ...commit(st, { ...st.screen, root: removeNode(st.screen.root, id) }), selectedId: null });
  },
  moveNode: (id, newParentId, index) => {
    const st = get();
    if (!st.screen) return;
    let moved: WidgetNode | undefined;
    const find = (n: WidgetNode): void => {
      for (const c of n.children ?? []) { if (c.id === id) moved = c; else find(c); }
    };
    find(st.screen.root);
    if (!moved) return;
    const without = removeNode(st.screen.root, id);
    set(commit(st, { ...st.screen, root: insertChild(without, newParentId, moved, index) }));
  },
  undo: () => {
    const st = get();
    if (!st.past.length || !st.screen) return;
    const prev = st.past[st.past.length - 1];
    set({ past: st.past.slice(0, -1), future: [st.screen, ...st.future], screen: prev });
  },
  redo: () => {
    const st = get();
    if (!st.future.length || !st.screen) return;
    const next = st.future[0];
    set({ past: [...st.past, st.screen], future: st.future.slice(1), screen: next });
  },
}));
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/store/editorStore.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add design-playground/src/store/editorStore.ts design-playground/src/store/editorStore.test.ts
git commit -m "feat(store): editor store with selection and undo/redo"
```

---

## Milestone 4 — Theme tokens & app_theme.dart generator (TDD)

### Task 4.1: Default theme mirroring app_theme.dart

**Files:**
- Create: `design-playground/src/theme/defaultTheme.ts`
- Test: `design-playground/src/theme/defaultTheme.test.ts`

- [ ] **Step 1: Write the failing test**

`src/theme/defaultTheme.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { defaultTheme } from './defaultTheme';
import { ThemeSchema } from '@/model/schemas';

describe('defaultTheme', () => {
  it('is a valid Theme', () => {
    expect(() => ThemeSchema.parse(defaultTheme)).not.toThrow();
  });
  it('mirrors the app primary color', () => {
    expect(defaultTheme.colors.primary).toBe('#006783');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/theme/defaultTheme.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/theme/defaultTheme.ts`**

Transcribe the token values from `aikarthya-field-ops-app/lib/core/theme/app_theme.dart`. Include at minimum the colors used by the Profile screen plus the typography styles. (Full color set may be added later; these cover the seed.)
```ts
import type { Theme } from '@/model/types';

export const defaultTheme: Theme = {
  colors: {
    primary: '#006783', onPrimary: '#FFFFFF', primaryContainer: '#CBF0FA',
    onPrimaryContainer: '#004E63', primaryFixedDim: '#62D4FF',
    secondary: '#525E7D', onSecondary: '#FFFFFF', onSecondaryFixed: '#0D1B36',
    background: '#FAFAF1', onBackground: '#1A1C17', surface: '#FAFAF1', onSurface: '#1A1C17',
    surfaceVariant: '#E3E3DA', onSurfaceVariant: '#3D484E',
    surfaceContainerLowest: '#FFFFFF', surfaceContainerLow: '#F4F4EB',
    surfaceContainerHigh: '#E9E9E0', neutralSurface: '#F4F4EB',
    outline: '#C8C8C0', error: '#D94F3D', onError: '#FFFFFF', errorContainer: '#FFDAD6',
    success: '#2E8B57', warning: '#F5842A', neutralGrey: '#6B6B60',
  },
  typography: {
    display: { fontFamily: 'Poppins', fontSize: 32, fontWeight: 800, height: 1.1875 },
    headlineLarge: { fontFamily: 'Poppins', fontSize: 24, fontWeight: 700, height: 1.25 },
    headlineMedium: { fontFamily: 'Poppins', fontSize: 18, fontWeight: 700, height: 1.333 },
    headlineSmall: { fontFamily: 'Poppins', fontSize: 15, fontWeight: 700, height: 1.333 },
    bodyLarge: { fontFamily: 'Poppins', fontSize: 15, fontWeight: 400, height: 1.5 },
    bodyMedium: { fontFamily: 'Poppins', fontSize: 13, fontWeight: 400, height: 1.5 },
    bodySmall: { fontFamily: 'Poppins', fontSize: 12, fontWeight: 400, height: 1.5 },
    labelStrong: { fontFamily: 'Montserrat', fontSize: 12, fontWeight: 700, height: 1.4 },
    labelCaps: { fontFamily: 'Montserrat', fontSize: 11, fontWeight: 700, height: 1.4, letterSpacing: 0.66 },
    tileNumber: { fontFamily: 'Poppins', fontSize: 28, fontWeight: 800, height: 1.1 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 4, md: 8, lg: 12, pill: 9999 },
  shadow: {
    low: '0 1px 2px rgba(0,0,0,0.08)',
    medium: '0 4px 8px rgba(0,0,0,0.12)',
    high: '0 12px 24px rgba(0,0,0,0.16)',
  },
  breakpoints: { mobile: 600, tablet: 1024, desktop: 1440, wide: 1920 },
};
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/theme/defaultTheme.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add design-playground/src/theme/defaultTheme.ts design-playground/src/theme/defaultTheme.test.ts
git commit -m "feat(theme): default theme mirrored from app_theme.dart"
```

---

### Task 4.2: app_theme.dart generator (auto-apply path for tokens)

**Files:**
- Create: `design-playground/src/theme/dartGenerator.ts`
- Test: `design-playground/src/theme/dartGenerator.test.ts`

- [ ] **Step 1: Write the failing test**

`src/theme/dartGenerator.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { generateAppColors } from './dartGenerator';
import { defaultTheme } from './defaultTheme';

describe('generateAppColors', () => {
  it('emits a Dart color constant in 0xAARRGGBB form', () => {
    const out = generateAppColors({ ...defaultTheme, colors: { primary: '#006783' } });
    expect(out).toContain('static const Color primary = Color(0xFF006783);');
  });
  it('preserves explicit alpha from #AARRGGBB', () => {
    const out = generateAppColors({ ...defaultTheme, colors: { scrim: '#80000000' } });
    expect(out).toContain('static const Color scrim = Color(0x80000000);');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/theme/dartGenerator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/theme/dartGenerator.ts`**

```ts
import type { Theme } from '@/model/types';

/** '#RRGGBB' -> '0xFFRRGGBB', '#AARRGGBB' -> '0xAARRGGBB'. */
export function hexToDart(hex: string): string {
  const h = hex.replace('#', '').toUpperCase();
  const argb = h.length === 6 ? `FF${h}` : h; // assume input #AARRGGBB when 8 chars
  return `0x${argb}`;
}

export function generateAppColors(theme: Theme): string {
  const lines = Object.entries(theme.colors).map(
    ([name, hex]) => `  static const Color ${name} = Color(${hexToDart(hex)});`,
  );
  return ['abstract final class AppColors {', ...lines, '}'].join('\n');
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/theme/dartGenerator.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add design-playground/src/theme/dartGenerator.ts design-playground/src/theme/dartGenerator.test.ts
git commit -m "feat(theme): app_theme.dart AppColors generator"
```

> Note: `#AARRGGBB` ordering. The Studio color picker stores `#RRGGBB` or, for explicit alpha, `#AARRGGBB` (alpha first) to match Dart's `Color(0xAARRGGBB)`. This is documented here and enforced by the picker control in Milestone 7.

---

## Milestone 5 — Diff engine & Changes Report (TDD)

### Task 5.1: Tree diff

**Files:**
- Create: `design-playground/src/diff/diffEngine.ts`
- Test: `design-playground/src/diff/diffEngine.test.ts`

- [ ] **Step 1: Write the failing test**

`src/diff/diffEngine.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { diffScreens } from './diffEngine';
import type { ScreenModel } from '@/model/types';

const base: ScreenModel = {
  screenName: 'p', themeMode: 'light', sourceDartPath: 'p.dart',
  root: { id: 'root', type: 'Column', props: {}, children: [
    { id: 'btn', type: 'Button', props: { borderRadius: 4, text: 'Go' } },
    { id: 'gone', type: 'Text', props: { text: 'x' } },
  ] },
};

describe('diffScreens', () => {
  it('detects a prop change', () => {
    const edited = structuredClone(base);
    edited.root.children![0].props.borderRadius = 8;
    const d = diffScreens(base, edited);
    expect(d.nodeChanges).toContainEqual(
      expect.objectContaining({ id: 'btn', key: 'borderRadius', from: 4, to: 8 }),
    );
  });
  it('detects a removed node', () => {
    const edited = structuredClone(base);
    edited.root.children = edited.root.children!.slice(0, 1);
    const d = diffScreens(base, edited);
    expect(d.structural).toContainEqual(expect.objectContaining({ op: 'remove', id: 'gone' }));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/diff/diffEngine.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/diff/diffEngine.ts`**

```ts
import type { ScreenModel, WidgetNode } from '@/model/types';
import { getDescriptor } from '@/schema/registry';

export interface NodeChange {
  id: string; type: WidgetNode['type']; key: string;
  from: unknown; to: unknown; flutter: string;
}
export interface StructuralChange {
  op: 'add' | 'remove' | 'move'; id: string; parent?: string; index?: number;
}
export interface ScreenDiff {
  screen: string; sourceDartPath: string;
  nodeChanges: NodeChange[]; structural: StructuralChange[];
}

function flatten(node: WidgetNode, parent: string | null, out: Map<string, { node: WidgetNode; parent: string | null }>): void {
  out.set(node.id, { node, parent });
  (node.children ?? []).forEach((c) => flatten(c, node.id, out));
}

export function diffScreens(base: ScreenModel, edited: ScreenModel): ScreenDiff {
  const baseMap = new Map<string, { node: WidgetNode; parent: string | null }>();
  const editMap = new Map<string, { node: WidgetNode; parent: string | null }>();
  flatten(base.root, null, baseMap);
  flatten(edited.root, null, editMap);

  const nodeChanges: NodeChange[] = [];
  const structural: StructuralChange[] = [];

  for (const [id, { node }] of editMap) {
    const prev = baseMap.get(id);
    if (!prev) { structural.push({ op: 'add', id, parent: editMap.get(id)!.parent ?? undefined }); continue; }
    if (prev.parent !== editMap.get(id)!.parent) {
      structural.push({ op: 'move', id, parent: editMap.get(id)!.parent ?? undefined });
    }
    const keys = new Set([...Object.keys(prev.node.props), ...Object.keys(node.props)]);
    for (const key of keys) {
      if (prev.node.props[key] !== node.props[key]) {
        nodeChanges.push({
          id, type: node.type, key,
          from: prev.node.props[key], to: node.props[key],
          flutter: getDescriptor(node.type, key)?.flutter.target ?? '(unmapped)',
        });
      }
    }
  }
  for (const [id] of baseMap) {
    if (!editMap.has(id)) structural.push({ op: 'remove', id });
  }
  return { screen: edited.screenName, sourceDartPath: edited.sourceDartPath, nodeChanges, structural };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/diff/diffEngine.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add design-playground/src/diff/diffEngine.ts design-playground/src/diff/diffEngine.test.ts
git commit -m "feat(diff): screen tree diff engine"
```

---

### Task 5.2: Markdown report writer

**Files:**
- Create: `design-playground/src/diff/reportWriter.ts`
- Test: `design-playground/src/diff/reportWriter.test.ts`

- [ ] **Step 1: Write the failing test**

`src/diff/reportWriter.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { toMarkdown } from './reportWriter';
import type { ScreenDiff } from './diffEngine';

const diff: ScreenDiff = {
  screen: 'profile', sourceDartPath: 'lib/features/pf_home/profile_tab.dart',
  nodeChanges: [{ id: 'btn', type: 'Button', key: 'borderRadius', from: 4, to: 8,
    flutter: 'FilledButton.style.shape.borderRadius' }],
  structural: [{ op: 'remove', id: 'gone' }],
};

describe('toMarkdown', () => {
  it('renders a human summary with the flutter mapping', () => {
    const md = toMarkdown(diff);
    expect(md).toContain('# Changes Report — profile');
    expect(md).toContain('borderRadius');
    expect(md).toContain('FilledButton.style.shape.borderRadius');
    expect(md).toContain('remove');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/diff/reportWriter.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/diff/reportWriter.ts`**

```ts
import type { ScreenDiff } from './diffEngine';

export function toMarkdown(diff: ScreenDiff): string {
  const lines: string[] = [];
  lines.push(`# Changes Report — ${diff.screen}`, '');
  lines.push(`**Source Dart:** \`${diff.sourceDartPath}\``, '');

  lines.push('## Property changes', '');
  if (diff.nodeChanges.length === 0) lines.push('_none_', '');
  else {
    lines.push('| Node | Property | From | To | Flutter target |');
    lines.push('|---|---|---|---|---|');
    for (const c of diff.nodeChanges) {
      lines.push(`| ${c.id} (${c.type}) | ${c.key} | ${fmt(c.from)} | ${fmt(c.to)} | \`${c.flutter}\` |`);
    }
    lines.push('');
  }

  lines.push('## Structural changes', '');
  if (diff.structural.length === 0) lines.push('_none_', '');
  else for (const s of diff.structural) {
    lines.push(`- **${s.op}** \`${s.id}\`${s.parent ? ` → parent \`${s.parent}\`` : ''}${s.index != null ? ` @${s.index}` : ''}`);
  }
  return lines.join('\n');
}

function fmt(v: unknown): string {
  return v === undefined ? '—' : String(v);
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/diff/reportWriter.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the whole suite**

Run in `design-playground/`: `npm test`
Expected: all tests PASS.

- [ ] **Step 6: Commit**

```bash
git add design-playground/src/diff/reportWriter.ts design-playground/src/diff/reportWriter.test.ts
git commit -m "feat(diff): markdown changes report writer"
```

---

## Milestone 6 — Renderer (concrete + dev verify)

### Task 6.1: Node → HTML renderer

**Files:**
- Create: `design-playground/src/renderer/renderNode.tsx`
- Create: `design-playground/src/renderer/styleMap.ts`

- [ ] **Step 1: Write `src/renderer/styleMap.ts`**

Maps widget props to CSS approximating Flutter. Helpers used by the renderer.
```ts
import type { Theme } from '@/model/types';

const MAIN: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end',
  spaceBetween: 'space-between', spaceAround: 'space-around', spaceEvenly: 'space-evenly',
};
const CROSS: Record<string, string> = {
  start: 'flex-start', center: 'center', end: 'flex-end', stretch: 'stretch',
};

export function flexStyle(direction: 'row' | 'column', p: Record<string, unknown>): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: direction,
    justifyContent: MAIN[(p.mainAxisAlignment as string) ?? 'start'],
    alignItems: CROSS[(p.crossAxisAlignment as string) ?? 'center'],
    gap: `${(p.spacing as number) ?? 0}px`,
    overflow: p.scroll ? 'auto' : 'visible',
  };
}

export function containerStyle(p: Record<string, unknown>, theme: Theme): React.CSSProperties {
  const shadowKey = (p.shadow as string) ?? 'none';
  return {
    background: (p.color as string) || undefined,
    borderRadius: `${(p.borderRadius as number) ?? 0}px`,
    border: (p.borderWidth as number) ? `${p.borderWidth}px solid ${p.borderColor}` : undefined,
    boxShadow: shadowKey !== 'none' ? theme.shadow[shadowKey] : undefined,
    padding: paddingCss(p.padding),
    margin: paddingCss(p.margin),
    width: (p.width as number) ? `${p.width}px` : undefined,
    height: (p.height as number) ? `${p.height}px` : undefined,
  };
}

export function paddingCss(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number') return `${v}px`;
  const o = v as { top?: number; right?: number; bottom?: number; left?: number };
  return `${o.top ?? 0}px ${o.right ?? 0}px ${o.bottom ?? 0}px ${o.left ?? 0}px`;
}
```

- [ ] **Step 2: Write `src/renderer/renderNode.tsx`**

```tsx
import type { WidgetNode, Theme } from '@/model/types';
import { flexStyle, containerStyle } from './styleMap';

interface Props { node: WidgetNode; theme: Theme; selectedId: string | null; onSelect: (id: string) => void; }

export function RenderNode({ node, theme, selectedId, onSelect }: Props): JSX.Element {
  const p = node.props;
  const sel = node.id === selectedId;
  const ring: React.CSSProperties = sel ? { outline: '2px solid #62D4FF', outlineOffset: '1px' } : {};
  const click = (e: React.MouseEvent) => { e.stopPropagation(); onSelect(node.id); };
  const kids = (node.children ?? []).map((c) => (
    <RenderNode key={c.id} node={c} theme={theme} selectedId={selectedId} onSelect={onSelect} />
  ));

  switch (node.type) {
    case 'Text':
      return <span style={{ ...textStyle(p), ...ring }} onClick={click}>{String(p.text ?? '')}</span>;
    case 'Row':
      return <div style={{ ...flexStyle('row', p), ...ring }} onClick={click}>{kids}</div>;
    case 'Column':
      return <div style={{ ...flexStyle('column', p), ...ring }} onClick={click}>{kids}</div>;
    case 'Container':
      return <div style={{ ...containerStyle(p, theme), ...ring }} onClick={click}>{kids}</div>;
    case 'Icon':
      return <span style={{ ...ring, fontSize: `${p.size}px`, color: p.color as string }} onClick={click}>◆</span>;
    case 'Button':
      return (
        <button onClick={click}
          style={{ ...ring, background: p.color as string, color: p.textColor as string,
            borderRadius: `${p.borderRadius}px`, border: 'none',
            padding: `${p.paddingV}px ${p.paddingH}px` }}>
          {String(p.text ?? '')}
        </button>
      );
    case 'Image':
      return <img style={{ ...ring, width: (p.width as number) || undefined, height: (p.height as number) || undefined,
        objectFit: (p.fit as React.CSSProperties['objectFit']) ?? 'cover', borderRadius: `${p.borderRadius}px` }}
        src={String(p.src ?? '')} alt="" onClick={click} />;
    case 'Input':
      return <input placeholder={String(p.hint ?? '')} onClick={click}
        style={{ ...ring, background: p.fillColor as string, borderRadius: `${p.borderRadius}px`,
          border: 'none', padding: '12px 16px' }} />;
    default:
      return <div style={ring} onClick={click}>{kids}</div>;
  }
}

function textStyle(p: Record<string, unknown>): React.CSSProperties {
  return {
    fontFamily: `'${p.fontFamily ?? 'Poppins'}', sans-serif`,
    fontSize: `${p.fontSize ?? 13}px`,
    fontWeight: Number(p.fontWeight ?? 400),
    color: (p.color as string) ?? '#1A1C17',
    letterSpacing: `${p.letterSpacing ?? 0}px`,
    lineHeight: String(p.height ?? 1.5),
    textAlign: (p.textAlign as React.CSSProperties['textAlign']) ?? 'left',
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add design-playground/src/renderer
git commit -m "feat(renderer): node-to-HTML renderer approximating Flutter"
```

---

### Task 6.2: Viewport frame

**Files:**
- Create: `design-playground/src/renderer/viewportFrame.tsx`

- [ ] **Step 1: Write `src/renderer/viewportFrame.tsx`**

```tsx
import type { Viewport } from '@/model/types';

const WIDTHS: Record<Viewport, number> = { mobile: 390, tablet: 768, desktop: 1280, wide: 1600 };

export function ViewportFrame({ viewport, children }: { viewport: Viewport; children: React.ReactNode }) {
  return (
    <div style={{ width: WIDTHS[viewport], margin: '0 auto', background: '#FAFAF1',
      minHeight: 600, boxShadow: '0 0 0 1px #2e333d', overflow: 'hidden' }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add design-playground/src/renderer/viewportFrame.tsx
git commit -m "feat(renderer): viewport device frame"
```

---

## Milestone 7 — Studio UI shell, inspector, palette, tree, export

### Task 7.1: Inspector controls

**Files:**
- Create: `design-playground/src/inspector/controls/index.tsx`

- [ ] **Step 1: Write `src/inspector/controls/index.tsx`**

One control component per `ControlType`, dispatched by a `Control` switch. Uses `react-colorful` for color.
```tsx
import { HexColorInput, HexColorPicker } from 'react-colorful';
import type { PropDescriptor } from '@/schema/descriptor';

interface CProps { descriptor: PropDescriptor; value: unknown; onChange: (v: unknown) => void; }

export function Control({ descriptor, value, onChange }: CProps) {
  const d = descriptor;
  switch (d.control) {
    case 'text':
    case 'url':
      return <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return <input type="number" min={d.min} max={d.max} step={d.step ?? 1}
        value={Number(value ?? 0)} onChange={(e) => onChange(Number(e.target.value))} />;
    case 'toggle':
      return <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />;
    case 'dropdown':
      return (
        <select value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
          {(d.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'color':
      return (
        <div>
          <HexColorPicker color={String(value ?? '#000000')} onChange={onChange} />
          <HexColorInput color={String(value ?? '#000000')} onChange={onChange} prefixed />
        </div>
      );
    case 'paddingBox':
      return <input type="number" min={0} value={Number(value ?? 0)}
        onChange={(e) => onChange(Number(e.target.value))} />;
    case 'alignmentGrid':
    case 'icon':
    case 'file':
    case 'slider':
    default:
      return <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add design-playground/src/inspector/controls
git commit -m "feat(inspector): schema-driven controls"
```

---

### Task 7.2: Inspector panel

**Files:**
- Create: `design-playground/src/inspector/Inspector.tsx`

- [ ] **Step 1: Write `src/inspector/Inspector.tsx`**

```tsx
import { useEditor } from '@/store/editorStore';
import { findNode } from '@/store/treeOps';
import { getDescriptors } from '@/schema/registry';
import { Control } from './controls';

export function Inspector() {
  const { screen, selectedId, setProp } = useEditor();
  if (!screen || !selectedId) return <aside style={{ padding: 16 }}>Select a widget</aside>;
  const node = findNode(screen.root, selectedId);
  if (!node) return <aside style={{ padding: 16 }}>—</aside>;
  const descriptors = getDescriptors(node.type);

  return (
    <aside style={{ padding: 16, overflow: 'auto' }}>
      <h3>{node.type} <small>{node.id}</small></h3>
      {descriptors.map((d) => (
        <label key={d.key} style={{ display: 'block', margin: '8px 0' }}>
          <span style={{ display: 'block', fontSize: 12, color: '#9aa1ad' }}>{d.label}</span>
          <Control descriptor={d} value={node.props[d.key]}
            onChange={(v) => setProp(node.id, { [d.key]: v })} />
        </label>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add design-playground/src/inspector/Inspector.tsx
git commit -m "feat(inspector): property panel"
```

---

### Task 7.3: Palette, tree, top bar, shell

**Files:**
- Create: `design-playground/src/palette/Palette.tsx`
- Create: `design-playground/src/tree/WidgetTree.tsx`
- Create: `design-playground/src/app/TopBar.tsx`
- Create: `design-playground/src/app/Shell.tsx`
- Modify: `design-playground/src/App.tsx`

- [ ] **Step 1: Write `src/palette/Palette.tsx`**

Palette lists addable widget types; clicking adds to the selected node (or root) — drag-drop wiring (dnd-kit) is layered in Task 7.4.
```tsx
import { useEditor } from '@/store/editorStore';
import type { WidgetType } from '@/model/types';

const ITEMS: WidgetType[] = ['Container', 'Row', 'Column', 'Text', 'Icon', 'Button', 'Image', 'Input'];

export function Palette() {
  const { screen, selectedId, addNode } = useEditor();
  const parent = selectedId ?? screen?.root.id ?? null;
  return (
    <nav style={{ padding: 12 }}>
      <h4>Widgets</h4>
      {ITEMS.map((t) => (
        <button key={t} disabled={!parent}
          onClick={() => parent && addNode(parent, t, 0)}
          style={{ display: 'block', width: '100%', margin: '4px 0' }}>
          + {t}
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Write `src/tree/WidgetTree.tsx`**

```tsx
import { useEditor } from '@/store/editorStore';
import type { WidgetNode } from '@/model/types';

function Row({ node, depth }: { node: WidgetNode; depth: number }) {
  const { selectedId, select, deleteNode } = useEditor();
  return (
    <div>
      <div style={{ paddingLeft: depth * 12, background: node.id === selectedId ? '#23272f' : undefined,
        display: 'flex', justifyContent: 'space-between' }}>
        <span onClick={() => select(node.id)}>{node.type}</span>
        <button onClick={() => deleteNode(node.id)}>✕</button>
      </div>
      {(node.children ?? []).map((c) => <Row key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}

export function WidgetTree() {
  const { screen } = useEditor();
  if (!screen) return null;
  return <div style={{ padding: 8 }}><Row node={screen.root} depth={0} /></div>;
}
```

- [ ] **Step 3: Write `src/app/TopBar.tsx`** (screen/viewport switch, undo/redo, export)

```tsx
import { useState } from 'react';
import { useEditor } from '@/store/editorStore';
import { diffScreens } from '@/diff/diffEngine';
import { toMarkdown } from '@/diff/reportWriter';
import type { Viewport } from '@/model/types';

const VIEWPORTS: Viewport[] = ['mobile', 'tablet', 'desktop', 'wide'];

export function TopBar({ viewport, setViewport }: { viewport: Viewport; setViewport: (v: Viewport) => void }) {
  const { screen, baseline, undo, redo } = useEditor();
  const [_, setTick] = useState(0);

  function exportReport() {
    if (!screen || !baseline) return;
    const diff = diffScreens(baseline, screen);
    const md = toMarkdown(diff);
    download(`changes.json`, JSON.stringify(diff, null, 2));
    download(`changes.md`, md);
    download(`target.json`, JSON.stringify(screen, null, 2));
    setTick((t) => t + 1);
  }

  return (
    <header style={{ display: 'flex', gap: 12, padding: 10, borderBottom: '1px solid #2e333d' }}>
      <strong>{screen?.screenName ?? '—'}</strong>
      <span>
        {VIEWPORTS.map((v) => (
          <button key={v} onClick={() => setViewport(v)}
            style={{ fontWeight: v === viewport ? 700 : 400 }}>{v}</button>
        ))}
      </span>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <button onClick={exportReport} style={{ marginLeft: 'auto' }}>Export Changes Report</button>
    </header>
  );
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}
```

- [ ] **Step 4: Write `src/app/Shell.tsx`**

```tsx
import { useState } from 'react';
import type { Viewport } from '@/model/types';
import { useEditor } from '@/store/editorStore';
import { defaultTheme } from '@/theme/defaultTheme';
import { Palette } from '@/palette/Palette';
import { WidgetTree } from '@/tree/WidgetTree';
import { Inspector } from '@/inspector/Inspector';
import { TopBar } from './TopBar';
import { RenderNode } from '@/renderer/renderNode';
import { ViewportFrame } from '@/renderer/viewportFrame';

export function Shell() {
  const [viewport, setViewport] = useState<Viewport>('mobile');
  const { screen, selectedId, select } = useEditor();

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100vh',
      color: '#e7e9ee', background: '#16181d', fontFamily: 'Poppins, sans-serif' }}>
      <TopBar viewport={viewport} setViewport={setViewport} />
      <div style={{ display: 'grid', gridTemplateColumns: '180px 220px 1fr 320px', overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid #2e333d', overflow: 'auto' }}><Palette /></div>
        <div style={{ borderRight: '1px solid #2e333d', overflow: 'auto' }}><WidgetTree /></div>
        <div style={{ overflow: 'auto', padding: 24 }} onClick={() => select(null)}>
          {screen && (
            <ViewportFrame viewport={viewport}>
              <RenderNode node={screen.root} theme={defaultTheme} selectedId={selectedId} onSelect={select} />
            </ViewportFrame>
          )}
        </div>
        <div style={{ borderLeft: '1px solid #2e333d', overflow: 'auto' }}><Inspector /></div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Replace `src/App.tsx`**

```tsx
import { useEffect } from 'react';
import { Shell } from './app/Shell';
import { useEditor } from './store/editorStore';
import { ScreenModelSchema } from './model/schemas';
import profile from '../screens/profile.json';

export default function App() {
  const loadScreen = useEditor((s) => s.loadScreen);
  useEffect(() => { loadScreen(ScreenModelSchema.parse(profile)); }, [loadScreen]);
  return <Shell />;
}
```

> This imports `screens/profile.json`, which is created in Milestone 8. Until then, use a temporary stub: create `screens/profile.json` with `{ "screenName": "stub", "themeMode": "light", "sourceDartPath": "", "root": { "id": "root", "type": "Column", "props": {} } }` so the app compiles, then replace it in Task 8.1.

- [ ] **Step 6: Verify in dev server**

Run `npm run dev`, open the URL. Expected: studio shell renders with the stub screen; clicking palette buttons adds widgets; selecting a widget shows inspector controls; editing a value updates the canvas; Export downloads `changes.json`/`changes.md`/`target.json`.

- [ ] **Step 7: Commit**

```bash
git add design-playground/src/palette design-playground/src/tree design-playground/src/app design-playground/src/App.tsx design-playground/screens/profile.json
git commit -m "feat(app): studio shell with palette, tree, inspector, export"
```

---

### Task 7.4: Drag-and-drop (palette → canvas, tree reorder)

**Files:**
- Modify: `design-playground/src/app/Shell.tsx`, `src/palette/Palette.tsx`, `src/tree/WidgetTree.tsx`

- [ ] **Step 1: Wrap the shell in a dnd-kit `DndContext`**

In `Shell.tsx`, import `DndContext` and `DragEndEvent` from `@dnd-kit/core`. Wrap the grid. On drag end, if `active.data.current?.paletteType` is set and `over` is a node drop target, call `addNode(over.id, active.data.current.paletteType, 0)`. If both `active` and `over` are tree node ids, call `moveNode(active.id, parentOf(over.id), index)`.
```tsx
// inside Shell, replacing the outer wrapper:
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
// ...
const { addNode, moveNode } = useEditor();
function onDragEnd(e: DragEndEvent) {
  const pal = e.active.data.current?.paletteType as string | undefined;
  if (pal && e.over) { addNode(String(e.over.id), pal as never, 0); return; }
  if (e.over && e.active.id !== e.over.id) { moveNode(String(e.active.id), String(e.over.id), 0); }
}
// wrap return: <DndContext onDragEnd={onDragEnd}> ...existing grid... </DndContext>
```

- [ ] **Step 2: Make palette items draggable**

In `Palette.tsx`, use `useDraggable({ id: `pal-${t}`, data: { paletteType: t } })` per item and spread `listeners`/`attributes`/`setNodeRef`.

- [ ] **Step 3: Make canvas containers droppable**

In `renderNode.tsx`, for `Container`/`Row`/`Column`, wrap with a droppable via `useDroppable({ id: node.id })` and apply `setNodeRef`. (Add a thin highlight when `isOver`.)

- [ ] **Step 4: Verify in dev server**

Run `npm run dev`. Expected: dragging a palette item onto a container inserts it there; dragging a tree row onto another reparents it. Selection and inspector still work.

- [ ] **Step 5: Commit**

```bash
git add design-playground/src/app/Shell.tsx design-playground/src/palette/Palette.tsx design-playground/src/renderer/renderNode.tsx
git commit -m "feat(canvas): drag-drop add and reparent via dnd-kit"
```

---

## Milestone 8 — Seed the Profile screen & run the loop

### Task 8.1: Translate Profile Dart → ScreenModel JSON

**Files:**
- Replace: `design-playground/screens/profile.json`

Source: `aikarthya-field-ops-app/lib/features/pf_home/profile_tab.dart`. Translate the static visual structure (the dynamic Riverpod data is represented with placeholder text). Cover: identity card (Container → Column → avatar Container, name Text, email Text, role badge Container/Text, programme/status Row), the section headers, assigned-school card, quick-action cards (Row of Container action cards), app-info rows, danger-zone sign-out Container.

- [ ] **Step 1: Author `screens/profile.json`**

Conform to `ScreenModelSchema`. Set `sourceDartPath` and add `flutterHint.sourceLine` on the major section nodes (identity card ≈ line 138, assigned schools ≈ 345, quick actions ≈ 533, app info ≈ 723, danger zone ≈ 907). Representative shape (the executor expands all sections):
```json
{
  "screenName": "profile",
  "themeMode": "light",
  "sourceDartPath": "lib/features/pf_home/profile_tab.dart",
  "root": {
    "id": "root", "type": "Column",
    "props": { "crossAxisAlignment": "stretch", "spacing": 32 },
    "children": [
      {
        "id": "identityCard", "type": "Container",
        "flutterHint": { "sourceFile": "lib/features/pf_home/profile_tab.dart", "sourceLine": 138 },
        "props": { "color": "#0D1B36", "borderRadius": 12, "shadow": "low", "padding": 16 },
        "children": [
          { "id": "idCol", "type": "Column", "props": { "crossAxisAlignment": "center", "spacing": 8 },
            "children": [
              { "id": "avatar", "type": "Container",
                "props": { "color": "#006783", "borderRadius": 9999, "width": 80, "height": 80 } },
              { "id": "name", "type": "Text",
                "props": { "text": "Field Officer Name", "fontFamily": "Poppins", "fontSize": 24,
                  "fontWeight": "700", "color": "#FFFFFF" } },
              { "id": "email", "type": "Text",
                "props": { "text": "officer@aikarthya.org", "fontSize": 12, "color": "#F4F4EB" } }
            ] }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Validate the JSON loads**

Run `npm run dev`, open the URL. Expected: the Profile screen renders in the mobile frame and visually resembles the real screen (dark identity card, name/email, sections below). Fix any zod parse errors reported in the browser console.

- [ ] **Step 3: Commit**

```bash
git add design-playground/screens/profile.json
git commit -m "feat(screens): seed Profile screen baseline from Dart"
```

---

### Task 8.2: End-to-end loop smoke test

- [ ] **Step 1: Make an edit and export**

In the running Studio: select the identity card, change `borderRadius` 12→20 and `color`; select `name`, change `fontSize`. Click **Export Changes Report**.

- [ ] **Step 2: Inspect the bundle**

Open the downloaded `changes.md`. Expected: a table listing `identityCard borderRadius 12 → 20` with Flutter target `BoxDecoration.borderRadius`, and the color + font-size changes with their targets. `changes.json` contains the same as structured data; `target.json` is the full edited tree.

- [ ] **Step 3: Confirm the apply path is actionable**

Verify each `flutter` target in the report points at a real construct in `profile_tab.dart` (e.g. `BorderRadius.circular(12)` on the identity `Container` at ~line 141). This confirms the report is precise enough for Claude to apply. No code change to the Flutter app in this task — this is the verification that the loop produces an applyable artifact.

- [ ] **Step 4: Document the loop in the playground README**

Create `design-playground/README.md` describing: how to run (`npm install && npm run dev`), how to edit, how to export, and that the exported bundle is handed to Claude (or applied manually) to change the Flutter app. Then commit:
```bash
git add design-playground/README.md
git commit -m "docs: design studio usage and export-to-apply loop"
```

---

## Milestone 9 — Catalog expansion (follow-up, same pattern)

The remaining report widgets follow the exact pattern of Tasks 2.1/6.1/7.1. Each is one schema file + one `renderNode` case + (if a new control) one control component. Add in this order, each its own commit:

- [ ] **Stack** — `src/schema/widgets/stack.ts` (alignment grid, fit); render as `position: relative` with absolutely-positioned children; register under `Stack`.
- [ ] **ListView** — axis, spacing, shrinkWrap, reverse; render as a scrolling flex; register under `ListView`.
- [ ] **GridView** — crossAxisCount, childAspectRatio, main/cross spacing; render as CSS grid; register under `GridView`.
- [ ] **ComponentInstance** — props panel from `ComponentDef.props`; render its `widgetTree` with prop substitution; add "Create Component" from a selection.
- [ ] **Per-viewport overrides & visibility** — extend the inspector with a viewport tab that writes `responsiveOverrides`/`visibility.perViewport`; extend `RenderNode` to apply the active viewport's overrides.
- [ ] **Remaining theme colors** — extend `defaultTheme.colors` to the full `AppColors` set so the token editor and `generateAppColors` round-trip the entire palette; add a typography generator alongside `generateAppColors`.

Each item: add the schema entry, add the renderer case, run `npm run dev` to verify it appears and edits, commit.

---

## Self-Review

**Spec coverage:**
- §1 Design Tokens → Milestone 4 (defaultTheme), token editor in M7/M9.
- §2 Theme system → Milestone 4 + generator; dark mode intentionally deferred (light-only decision, spec §14).
- §3 Viewports → Task 6.2 + M9 per-viewport overrides.
- §4 Property Inspector → Milestones 2 + 7 (schema registry drives inspector); full catalog completed in M9.
- §5 Drag-drop/nesting → Task 7.4.
- §6 State & visibility → M9 (per-viewport visibility, bindings represented in model now).
- §7 Component system → M9 (ComponentInstance).
- §8 Export mapping → Milestone 5 (`flutter` target per descriptor flows into the report).
- §9 Accessibility/localization → not in v1 scope; tracked as future (note below).
- §10 JSON schemas → Milestone 1 (zod schemas) + seeded `profile.json`.

**Known deferrals (explicit, not placeholders):** dark mode (per decision); accessibility/localization inspector fields (report §9); gradient/background-image controls on Container (report §4 Container) — add as schema entries in M9 if needed. These are scope choices, listed here so they are not mistaken for gaps.

**Placeholder scan:** no "TBD"/"implement later" in tasks; the one temporary stub (`profile.json` in Task 7.3 Step 5) is explicitly replaced in Task 8.1.

**Type consistency:** `WidgetNode`, `ScreenModel`, `Theme`, `PropDescriptor` names and shapes are identical across model, schema, store, diff, renderer, and UI tasks. Store actions (`loadScreen`, `setProp`, `addNode`, `deleteNode`, `moveNode`, `undo`, `redo`, `select`) are referenced consistently in M7. `diffScreens`/`toMarkdown` signatures match between M5 and the TopBar export.
