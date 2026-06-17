# Aikarthya Design Studio

A browser-based visual design tool for the Aikarthya Field Ops Flutter app. The studio lets designers and developers inspect, edit, and export screen layouts without touching Flutter source directly. Changes are exported as a structured bundle that is handed to Claude (or a developer) to apply back to the Flutter codebase.

## Running the studio

```
npm install
npm run dev
```

Open the localhost URL printed in the terminal (typically `http://localhost:5173`). The studio loads immediately with the seeded Profile screen on the canvas.

## Panels

| Panel | Location | Purpose |
|---|---|---|
| Palette | Left sidebar | Drag widget types (Container, Row, Column, Text, Icon, Button, Image, Input) onto the canvas |
| Tree | Left sidebar (below palette) | Hierarchical view of every widget node; click to select |
| Canvas | Centre | Live HTML render of the screen model at the chosen viewport size |
| Inspector | Right sidebar | Edit every prop of the selected widget (color, fontSize, spacing, etc.) in real time |
| Viewport switch | Top bar | Toggle between Mobile (390 px), Tablet (768 px), and Desktop (1280 px) preview widths |

## Editing

1. Click any widget on the canvas or in the tree to select it.
2. Edit its properties in the inspector panel on the right. Changes apply instantly to the canvas.
3. To add a new widget, drag an item from the palette and drop it onto a Container, Row, or Column node in the canvas or tree.
4. Undo / redo with Ctrl+Z / Ctrl+Y.

## Exporting changes

Click the **Export** button in the top bar. The studio downloads a zip-style bundle containing:

- `changes.json` — a machine-readable diff listing every property that changed from the baseline, keyed by widget id.
- `changes.md` — a human-readable Markdown report of the same diff, suitable for a pull-request description.
- `target.json` — the full updated ScreenModel, ready to replace the seed file.

Hand this bundle to Claude Code (or paste `changes.md` into a chat) and ask it to apply the changes to the Flutter app:

- **Theme / token changes** — Claude regenerates `lib/core/theme/app_theme.dart` from the updated colour and typography values.
- **Layout changes** — Claude edits the target screen's Dart file, matching widget ids in `changes.json` to the corresponding Flutter widgets via the `flutterHint.sourceLine` metadata embedded in the model.

## Seeded screen: Profile tab

The canvas is pre-loaded with a faithful model of the Profile tab (`lib/features/pf_home/profile_tab.dart`). The model was derived by reading the actual Dart source and resolving `AppColors.*` and `AppTypography.*` tokens to their hex / numeric values from `lib/core/theme/app_theme.dart`.

The canvas is an approximation rendered in HTML — it is not a pixel-exact Flutter render. Fonts, shadows, and layout constraints may differ slightly from the device. The intent is to give designers a fast, editable representation of the real screen structure, not a screenshot replacement.

The model file lives at `design-playground/screens/profile.json` and is validated on startup against `ScreenModelSchema` (Zod schema in `src/model/schemas.ts`). The six top-level sections in the model correspond exactly to the six section widgets in the Flutter source:

1. Identity card (line 138)
2. Assigned schools (line 345)
3. Quick actions (line 533)
4. App info (line 723)
5. Diagnostic (line 832)
6. Danger zone / Sign Out (line 907)
