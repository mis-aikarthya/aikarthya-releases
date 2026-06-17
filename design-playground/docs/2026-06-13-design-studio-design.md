# Aikarthya Design Studio — Design Spec

- **Date:** 2026-06-13
- **Status:** Approved design, pre-implementation
- **Location of system:** `design-playground/` (repo root, sibling of `aikarthya-field-ops-app/`)
- **Owner workflow:** visual editing by the user → exported Changes Report → Claude applies edits to Flutter Dart

---

## 1. Purpose

The Aikarthya app (`aikarthya-field-ops-app/`) is hand-written Flutter/Dart. There is no
visual frontend editor and changing the look means editing Dart by hand. The **Design
Studio** is a browser-based visual editor that lets a non-developer (or the user manually)
redesign any screen — UI, UX, layout, drag-and-drop — and then emit a **Changes Report**
that Claude consumes to make the corresponding Dart edits.

The Studio is **not** the runtime UI of the app. It is a design surface plus a hand-off
format. The Flutter app remains the single source of truth for production.

### Goals
- Visually edit any seeded screen: drag-drop widgets, reorder, restyle, change layout.
- Full widget catalog from the research report (Container, Row, Column, Stack, Text, Image,
  Button, Input, ListView, GridView, reusable Components).
- A token/theme editor that mirrors `app_theme.dart` and can regenerate it directly.
- Per-viewport (mobile/tablet/desktop/wide) preview and overrides.
- Export a **Changes Report** (machine + human readable + Flutter mapping) as the hand-off.
- Runnable manually by the user with `npm install && npm run dev`.

### Non-goals (v1)
- Not a live runtime UI engine for the app (no server-driven UI rewrite).
- Not pixel-identical to Flutter rendering (see fidelity caveat, §3).
- No backend, auth, or multi-user collaboration.
- No automatic Dart parsing inside the app; seeding is done by Claude (§9).

---

## 2. Workflow loop

```
1. SEED    Claude translates a screen's Dart → ScreenModel JSON (design-playground/screens/<screen>.json)
2. EDIT    User opens the Studio, edits visually (drag-drop, inspector, theme tokens)
3. EXPORT  Studio emits a Changes Report (changes.json + changes.md + flutter-mapping;
           theme edits additionally emit a ready app_theme.dart)
4. APPLY   Claude reads the report and edits Dart:
              - token/theme changes  → auto-generated (mechanical)
              - layout/structure     → AI-assisted, reviewed
5. VERIFY  Claude runs the real app and screenshots the screen to confirm fidelity
6. (loop)  Re-seed the screen to reset the baseline for the next round
```

---

## 3. Canvas fidelity (the key trade-off)

The canvas renders each `WidgetNode` with HTML/CSS (Flexbox) tuned to imitate Flutter's
Row/Column/Stack/Container semantics, using the real design tokens.

This is a faithful **approximation**, not a pixel-exact Flutter render. Known divergences to
manage: intrinsic sizing, `Expanded`/`Flexible` flex distribution edge cases, baseline
alignment, and text line-height rounding. We accept this because an editable DOM is required
for drag-and-drop and inspection (embedding real Flutter Web gives pixel accuracy but no
editable DOM — rejected). The VERIFY step (§2.5) closes the gap by screenshotting the real
app after changes are applied.

---

## 4. Tech stack

- **React + TypeScript + Vite** — component model + fast dev server, no build ceremony.
- **zustand** — editor state (project, selection) with an undo/redo middleware.
- **dnd-kit** — palette→canvas drag, tree reorder, drop-zone validation.
- **react-colorful** — color picker control.
- **zod** — runtime validation of models and imported screen JSON.

Launch: `cd design-playground && npm install && npm run dev`.

---

## 5. Architecture — modules

Each module has one responsibility, a typed interface, and is testable in isolation.

| Module | Responsibility |
|---|---|
| `model/` | Pure types + zod schemas: `Theme`, `WidgetNode`, `ScreenModel`, `Component`, `Project`. No UI, no side effects. |
| `schema/` | Per-widget **property registry** — the report's §4 inspector tables as data. Drives inspector controls, validation, JSON mapping, and Flutter codegen hints. |
| `store/` | zustand store: project state, current selection, undo/redo, actions (`addNode`, `moveNode`, `deleteNode`, `setProp`, `setToken`, `setResponsiveOverride`). |
| `renderer/` | Pure function `WidgetNode tree + Theme + Viewport → React canvas`. Theme- and viewport-aware. |
| `palette/` | Widget palette list + drag sources, grouped (Layout / Display / Input / Components). |
| `canvas/` | Drop zones, selection overlay, resize handles, smart guides, device frames, zoom. |
| `inspector/` | Schema-driven panel. Generic controls: text, number(±step), color, toggle, dropdown, slider, alignment-grid, padding/margin box, icon picker, file/URL, variable-bind. |
| `tree/` | Widget-tree sidebar with drag-reorder and visibility toggles. |
| `theme-editor/` | Token editing UI + **`app_theme.dart` generator** (auto-apply path for theme). |
| `diff/` | Baseline vs. current → Changes Report (changes.json + changes.md + flutter-mapping). |
| `io/` | Load seeded screen JSON, save/load project, download report bundle. |
| `app/` | Studio shell: top bar (screen switcher, viewport switcher, dark/light, export), left palette, center canvas, right inspector, bottom/left tree. |

Dependency direction: `model/` ← everything; `schema/` depends only on `model/`; UI modules
depend on `store/`, `renderer/`, `schema/`. No circular deps.

---

## 6. Data model

Illustrative TypeScript shapes (final types live in `model/`).

```ts
type Viewport = 'mobile' | 'tablet' | 'desktop' | 'wide';

interface Theme {
  colors: Record<string, string>;        // mirrors AppColors (hex)
  typography: Record<string, TextStyleToken>; // mirrors AppTypography
  spacing: Record<string, number>;
  radius: Record<string, number>;
  shadow: Record<string, string>;
  breakpoints: { mobile: number; tablet: number; desktop: number; wide: number };
}

interface TextStyleToken {
  fontFamily: string; fontSize: number; fontWeight: number;
  height?: number; letterSpacing?: number;
}

type WidgetType =
  | 'Container' | 'Row' | 'Column' | 'Stack'
  | 'Text' | 'Image' | 'Button' | 'Input'
  | 'ListView' | 'GridView' | 'ComponentInstance';

interface WidgetNode {
  id: string;
  type: WidgetType;
  props: Record<string, unknown>;          // validated per schema/ for this type
  children?: WidgetNode[];
  visibility?: {
    conditional?: string;                  // expression, optional
    perViewport?: Partial<Record<Viewport, boolean>>;
  };
  responsiveOverrides?: Partial<Record<Viewport, Record<string, unknown>>>;
  bindings?: Record<string, string>;       // prop -> variable expression
  componentRef?: string;                   // when type === 'ComponentInstance'
  flutterHint?: { sourceFile?: string; sourceLine?: number }; // set during seeding
}

interface ScreenModel {
  screenName: string;
  themeMode: 'light' | 'dark';
  root: WidgetNode;
  sourceDartPath: string;                  // e.g. lib/features/auth/...
}

interface ComponentDef {
  name: string;
  props: Record<string, { type: string; default: unknown }>;
  widgetTree: WidgetNode;
}

interface Project {
  theme: Theme;
  screens: ScreenModel[];
  components: ComponentDef[];
}
```

---

## 7. Schema-driven inspector

`schema/` holds, per `WidgetType`, an array of property descriptors:

```ts
interface PropDescriptor {
  key: string;                 // JSON key in node.props
  label: string;
  group: 'Layout' | 'Style' | 'Text' | 'Actions' | 'Advanced';
  control: 'text' | 'number' | 'color' | 'toggle' | 'dropdown'
         | 'slider' | 'alignmentGrid' | 'paddingBox' | 'icon' | 'file' | 'url';
  options?: string[];          // for dropdown
  min?: number; max?: number; step?: number;
  default: unknown;
  responsive?: boolean;        // can be set per-viewport
  flutter: {                   // mapping used by Changes Report + codegen hint
    target: string;            // e.g. "Container.decoration.color"
    note?: string;             // e.g. "wraps in AnimatedContainer if animate=true"
  };
}
```

The inspector renders controls purely from this registry. Validation (clamp/regex), the
JSON shape, and the Flutter mapping all derive from the same descriptors. **Adding a widget =
adding one schema entry.** The full descriptor set is transcribed from the research report §4
(Container, Row/Column, Stack, Text, Image, Button, Input, ListView, GridView, Component).

---

## 8. Canvas, drag-drop & viewports

- **Palette → canvas:** drag a widget; valid parents highlight drop zones; invalid drops are
  rejected (e.g. a positioned-only child outside a Stack).
- **Reorder:** drag within the tree or between siblings on canvas.
- **Selection:** click selects; resize handles on corners/sides; smart alignment guides.
- **Viewport switcher:** mobile / tablet / desktop / wide device frames; breakpoints from
  `Theme.breakpoints`. Per-viewport visibility toggles and `responsiveOverrides` per node.
- **Dark/light toggle:** v1 app ships light only; the Studio supports a dark preview slot so
  future dark theme work has a home, but defaults to light.

---

## 9. Seeding (Dart → ScreenModel JSON)

Done by Claude, not by app code. For each target screen Claude reads its Dart and writes
`design-playground/screens/<screen>.json` conforming to `ScreenModel`, setting
`sourceDartPath` and per-node `flutterHint`. This produces a canvas that mirrors the real
screen as the editing baseline. Seeding is a content/translation task per screen, kept out of
the app to avoid building a Dart parser.

First seeded screen (smoke test of the whole loop): **login** (or dashboard — TBD with user
at implementation start).

---

## 10. Changes Report (the hand-off artifact)

On **Export**, `diff/` compares the edited tree against the seeded baseline and writes a
bundle to `design-playground/exports/<screen>-<timestamp>/`:

- **`changes.json`** — structured diff:
  ```json
  {
    "screen": "login",
    "sourceDartPath": "lib/features/auth/...",
    "themeChanges": [{ "token": "radius.sm", "from": 4, "to": 8 }],
    "nodeChanges": [
      { "id": "btn_signin", "op": "prop", "key": "borderRadius",
        "from": 4, "to": 8, "flutter": "FilledButton.shape.borderRadius" }
    ],
    "structural": [
      { "op": "move", "id": "lnk_forgot", "newParent": "col_form", "index": 3 }
    ]
  }
  ```
- **`changes.md`** — plain-English summary, e.g.
  *"Login: primary button corner radius 4→8; moved 'Forgot password' below the button;
  warmed the background tint."*
- **flutter-mapping** (section inside `changes.md`) — each change annotated with its likely
  Dart target from the schema's `flutter.target`, so Claude applies precisely.
- **`target.json`** — the full edited `ScreenModel` (desired end state).
- **`app_theme.dart`** — emitted only when theme tokens changed; a ready replacement for
  `aikarthya-field-ops-app/lib/core/theme/app_theme.dart` (the mechanical auto-apply path).

---

## 11. Apply-back & verify

- **Theme/token changes** → mechanical. Claude diffs the emitted `app_theme.dart` against the
  current file and applies it; changes propagate app-wide because every screen references
  `AppColors`/`AppTypography`.
- **Layout/structural changes** → AI-assisted. Claude reads `changes.json` + `changes.md` +
  flutter-mapping and edits the screen's Dart, using `flutterHint`/`sourceDartPath` to locate
  code. Each edit is reviewed, not blind-applied.
- **Verify** → Claude runs the app and screenshots the screen, comparing against `target.json`
  to confirm the approximation matched reality. Re-seed to reset the baseline.

---

## 12. Folder structure

```
design-playground/
  docs/                 # this spec + future design notes
  src/
    model/  schema/  store/  renderer/  palette/  canvas/
    inspector/  tree/  theme-editor/  diff/  io/  app/
  screens/              # seeded ScreenModel JSON (baselines)
  exports/              # generated Changes Report bundles
  index.html  package.json  vite.config.ts  tsconfig.json
```

---

## 13. Build phases (detail comes in the implementation plan)

1. **Scaffold** — Vite+React+TS project, shell layout, zustand store, model + zod.
2. **Schema + inspector** — property registry for all widgets; schema-driven inspector.
3. **Renderer + canvas** — node→HTML renderer; selection; viewport frames.
4. **Drag-drop** — palette, drop-zone validation, tree reorder.
5. **Theme editor** — token UI + `app_theme.dart` generator.
6. **Diff + export** — baseline diff → Changes Report bundle.
7. **Seed first screen** — translate one real screen; run the full loop end-to-end; verify.
8. **Expand** — remaining widgets' polish, components, responsive overrides, more screens.

---

## 14. Resolved decisions

- **First screen to seed:** the **Profile** page (`lib/features/profile/`).
- **Git at root:** yes — the repo root becomes a git repo so the Studio + specs are versioned
  (separate from the existing `aikarthya-field-ops-app/` repo).
- **Dark theme:** **light only** for now; no dark slot — defer entirely until the app gains a
  dark theme.
