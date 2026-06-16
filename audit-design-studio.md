# Design Studio Audit Report

**Scope:** `design-playground/src/` (React/Vite visual editor)  
**Date:** 2026-06-15  
**Auditor:** Claude (kimi-k2.6)

---

## 1. UX Problems

| # | File | Line(s) | Issue | Severity |
|---|------|---------|-------|----------|
| 1.1 | `palette/Palette.tsx` | 14–25 | Palette items are plain `<button>` elements with no hover/active affordance. Clicking always inserts at index `0` with no user control over drop position. | Medium |
| 1.2 | `palette/Palette.tsx` | 18–19 | `disabled={!parent}` disables every button when no container is selected, but there is no visual distinction (opacity, cursor) to communicate why. | Medium |
| 1.3 | `tree/WidgetTree.tsx` | 7–15 | Tree rows show a delete button (✕) on every node including root; store guards root deletion but the UI still offers the control, which is confusing. No confirmation before deletion. | High |
| 1.4 | `tree/WidgetTree.tsx` | 7–15 | No expand/collapse mechanism. On a screen with dozens of nested widgets the tree becomes an overwhelming wall of text. | Medium |
| 1.5 | `app/TopBar.tsx` | 24–27 | Viewport toggles rely solely on `fontWeight` to indicate active state. On a dark background the difference between 400 and 700 is barely perceptible. | Low |
| 1.6 | `app/TopBar.tsx` | 11–18 | Exporting the Changes Report triggers three immediate downloads with no toast, progress, or success feedback. Users may think nothing happened. | Medium |
| 1.7 | `inspector/Inspector.tsx` | 6–25 | Inspector renders all controls in a flat list with no section headers (e.g. "Layout", "Style"). On a widget with many props it is hard to scan. | Medium |
| 1.8 | `inspector/Inspector.tsx` | 8 | Empty state "Select a widget" is unstyled and abrupt; no guidance or illustration. | Low |
| 1.9 | `renderer/renderNode.tsx` | 46–49 | `<input>` widget is rendered as a static DOM input with no `onChange`; it looks interactive but is not. Clicking it selects the widget instead of focusing the field. | Medium |
| 1.10 | `renderer/renderNode.tsx` | 42–45 | Image widget renders `src={String(p.src ?? '')}`. When `src` is empty the browser shows a broken-image icon rather than a placeholder. | Low |
| 1.11 | `renderer/renderNode.tsx` | 31–32 | Icon widget always renders a literal diamond (`◆`) regardless of the `icon` prop value. Users cannot preview actual icons. | Medium |

---

## 2. Visual Inconsistencies

| # | File | Line(s) | Issue | Severity |
|---|------|---------|-------|----------|
| 2.1 | `app/Shell.tsx` | 35–49 | Entire layout uses hard-coded hex values (`#16181d`, `#2e333d`, `#e7e9ee`). No shared CSS variables or theme tokens, making future palette swaps error-prone. | Low |
| 2.2 | `app/TopBar.tsx` | 21–32 | Buttons use browser-default styling inside a dark-themed header. They lack consistent padding, border-radius, background, or color overrides. | Medium |
| 2.3 | `tree/WidgetTree.tsx` | 8 | Tree indentation uses `paddingLeft: depth * 12` but provides no vertical guides or connectors, so hierarchy depth is hard to judge visually. | Low |
| 2.4 | `tree/WidgetTree.tsx` | 8 | Selected row background (`#23272f`) is very close to the app background (`#16181d`), providing low contrast. | Low |
| 2.5 | `inspector/controls/index.tsx` | 6–45 | Controls are unstyled native inputs/selects. In a dark-themed app the native `<select>` dropdown will appear light on some OSs, creating a jarring contrast. | Medium |
| 2.6 | `renderer/renderNode.tsx` | 14–16 | Selection outline uses `outlineOffset: '1px'` on a `div` inside a scrollable canvas; in some browsers this can clip or cause subtle layout jitter. | Low |
| 2.7 | `renderer/renderNode.tsx` | 22–66 | Mix of inline elements (`<span>`, `<button>`, `<input>`, `<img>`) and block elements (`<div>`) without explicit `display` overrides. Text inside `Row`/`Column` may inherit unexpected line-height from `<span>`. | Low |
| 2.8 | `renderer/styleMap.ts` | 23–34 | `containerStyle` treats prop value `0` as "auto" for `width`/`height`. In CSS, `0px` is a valid dimension; the implicit magic value is confusing. | Low |

---

## 3. Missing Accessibility

| # | File | Line(s) | Issue | Severity |
|---|------|---------|-------|----------|
| 3.1 | `tree/WidgetTree.tsx` | 7–15 | Tree is a flat list of `<div>` elements. Missing `role="tree"`, `role="treeitem"`, `aria-expanded`, `aria-selected`, and `aria-level`. Screen-reader users cannot perceive hierarchy. | High |
| 3.2 | `tree/WidgetTree.tsx` | 11 | Delete button has no `aria-label`; screen readers will announce "multiplication sign button" or nothing. | High |
| 3.3 | `palette/Palette.tsx` | 14–24 | Palette buttons lack `aria-label` and `aria-disabled` states. | Medium |
| 3.4 | `app/TopBar.tsx` | 24–27 | Viewport buttons should use `aria-pressed="true"` for the active viewport. | Medium |
| 3.5 | `app/TopBar.tsx` | 29–31 | Undo/Redo/Export buttons have no `aria-label` or `aria-disabled` states. | Medium |
| 3.6 | `inspector/controls/index.tsx` | 6–45 | `<label>` wraps a `<span>` + control but does not use `htmlFor`, so clicking the label text does not focus the control in some cases. | Medium |
| 3.7 | `inspector/controls/index.tsx` | 16 | Checkbox toggle has no visible label text; only the preceding `<span>` acts as a label, which may not be announced properly. | Medium |
| 3.8 | `renderer/renderNode.tsx` | 42–45 | Image `alt=""` unconditionally marks images as decorative. If the `src` represents content, it should derive alt text from props or warn the user. | Medium |
| 3.9 | `renderer/renderNode.tsx` | 33–40 | Button element has no `type="button"`. If ever wrapped in a `<form>` it will submit. | Low |
| 3.10 | *Global* | — | No keyboard shortcuts documented or implemented for Delete, Undo (Ctrl+Z), Redo (Ctrl+Shift+Z), Escape (deselect), or arrow-key navigation in the tree. | Medium |
| 3.11 | *Global* | — | Focus indicators (`:focus-visible`) are absent across the app. Keyboard users cannot see where focus is. | High |
| 3.12 | `renderer/renderNode.tsx` | 8–66 | Canvas widgets are not focusable (`tabIndex` not set) and have no `aria-label` describing the widget type + ID. | Medium |

---

## 4. Performance Issues

| # | File | Line(s) | Issue | Severity |
|---|------|---------|-------|----------|
| 4.1 | `app/Shell.tsx` | 21 | `const { screen, selectedId, select, addNode } = useEditor();` subscribes to the entire Zustand store. Any tiny change (e.g. a prop edit) re-renders `Shell`, which re-renders the entire grid layout. | High |
| 4.2 | `palette/Palette.tsx` | 28 | `const { screen, selectedId } = useEditor();` also subscribes to the whole store, causing palette re-render on every edit. | Medium |
| 4.3 | `renderer/renderNode.tsx` | 8–66 | `selectedId` is passed down the recursive tree. Every selection change causes every `RenderNode` to re-render. Should use a reactive selector or split selection state into a separate context. | High |
| 4.4 | `tree/WidgetTree.tsx` | 5–16 | Same problem: `selectedId` is read inside every `Row`, so selecting a node re-renders the entire tree. | Medium |
| 4.5 | `store/treeOps.ts` | 12–35 | `updateProps`, `removeNode`, and `insertChild` create shallow copies at every level of the tree. For deep widgets this is O(depth * children) with no structural sharing (e.g. Immer). | Low |
| 4.6 | `renderer/renderNode.tsx` | 10 | `useDroppable` is called unconditionally on every single node. In a tree with hundreds of widgets this creates hundreds of droppable registrations, increasing DnD-kit overhead. | Medium |
| 4.7 | `app/TopBar.tsx` | 36–43 | `download()` revokes the blob URL immediately after `a.click()`. While generally safe for same-origin blobs, rapid repeated exports could race in slower environments. | Low |

---

## 5. Dead Code / TODOs

| # | File | Line(s) | Issue | Severity |
|---|------|---------|-------|----------|
| 5.1 | `app/Shell.tsx` | 30 | `// TODO(M9): drag-to-reorder/reparent in the tree & canvas...` — a documented gap, but the comment implies the feature is incomplete. | Low |
| 5.2 | `model/schemas.ts` | 65 | Comment: `ComponentDefSchema / ProjectSchema are added in a later milestone...` — interfaces `ComponentDef` and `Project` in `model/types.ts` (47–57) are imported nowhere in the codebase. | Low |
| 5.3 | `schema/descriptor.ts` | 3–4 | `ControlType` includes `'slider' | 'file'` but `inspector/controls/index.tsx` (38–43) falls through to a plain text input for both. | Low |
| 5.4 | `renderer/renderNode.tsx` | 63–64 | `default` branch returns a generic `<div>`. Because the `switch` covers every value in `WidgetType`, this branch is unreachable dead code. | Low |
| 5.5 | `theme/defaultTheme.ts` | 4–57 | Extensive color palette (60+ entries) is defined but the renderer almost never consults it; colors come from inline widget props. Only `theme.shadow` is used via `containerStyle`. | Low |

---

## 6. Bugs / Potential Crashes

| # | File | Line(s) | Issue | Severity |
|---|------|---------|-------|----------|
| 6.1 | `App.tsx` | 5–9 | `profile.json` is imported and parsed with `ScreenModelSchema.parse(profile)` inside `useEffect` with no `try/catch`. A malformed JSON or schema mismatch will throw during mount and crash the app with a white screen. | High |
| 6.2 | `renderer/renderNode.tsx` | 24 | `String(p.text ?? '')` will stringify numbers safely but objects will become `"[object Object]"` without warning. | Low |
| 6.3 | `inspector/controls/index.tsx` | 13–14 | Number input uses `value={Number(value ?? 0)}`. If the user clears the field, `e.target.value` becomes `""` and `Number("")` is `0`, making it impossible to leave the field truly empty. | Medium |
| 6.4 | `inspector/controls/index.tsx` | 26–27 | Color input regex `raw.replace(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{6})$/, '#$2')` only strips alpha from 8-char hex. If `raw` is `'transparent'`, `'red'`, or malformed, `hex6` stays invalid and `react-colorful` may throw or render black unexpectedly. | Medium |
| 6.5 | `renderer/styleMap.ts` | 37–42 | `paddingCss` casts `v` to `{top,right,bottom,left}` without type checks. If `v` is a string (e.g. `"16px"`), it returns `"undefinedpx undefinedpx undefinedpx undefinedpx"`. | Medium |
| 6.6 | `diff/diffEngine.ts` | 23–27 | `propsEqual` uses `JSON.stringify(a) === JSON.stringify(b)`. Different key orders produce false negatives (reports a change when there is none). Also `undefined` values are silently dropped by `JSON.stringify`, masking differences. | Low |
| 6.7 | `diff/reportWriter.ts` | 31–33 | `escapeMd` only escapes pipe (`|`) and backticks. Asterisks, underscores, brackets, and hash signs in prop values can corrupt Markdown formatting or accidentally create headers/lists. | Low |
| 6.8 | `store/editorStore.ts` | 69–80 | `undo`/`redo` arrays grow without limit. In a long session this can consume unbounded memory and eventually degrade performance or crash the tab. | Medium |
| 6.9 | `store/editorStore.ts` | 60–68 | `moveNode` calls `findNode(moved, newParentId)` to detect cycles. This traverses the entire subtree on every move — O(n) per operation. For large trees this is a latency hotspot. | Low |
| 6.10 | `store/treeOps.ts` | 18–24 | `removeNode` does `children.filter(...).map(...)` at every level, even levels where no child was removed. This is wasteful and scales poorly with depth. | Low |

---

## 7. Polish Ideas

### Micro-interactions
- **Hover states:** Add subtle background/color transitions (`transition: 150ms ease`) to palette buttons, tree rows, TopBar buttons, and inspector controls.
- **Selection animation:** Animate the `outline` width or color on canvas selection instead of an instant jump.
- **Drag preview:** Provide a custom drag overlay (e.g. a ghost card showing the widget type) when dragging from the palette.
- **Tree hover:** Show a faint horizontal rule on tree-row hover to emphasize the target drop zone during future drag-and-drop.

### Empty / Loading / Error States
- **Loading skeleton:** While `screen` is null (before `profile.json` loads), show a shimmer skeleton instead of a blank canvas.
- **Inspector empty state:** Replace "Select a widget" with a centered illustration + short helper text (e.g. "Click any widget on the canvas to edit its properties").
- **Tree empty state:** If a node has no children, show a faint "No children" placeholder inside the tree row to avoid a visual gap.
- **Error boundary:** Wrap `App` in a React error boundary so schema validation failures or runtime crashes show a friendly message instead of a white screen.

### Responsive Tweaks
- **Panel collapsing:** On viewports narrower than ~1280px, the `180px + 220px + 1fr + 320px` grid overflows. Add collapse toggles for the Palette and Widget Tree panels, or convert them to resizable split-panes.
- **Viewport scaling:** The canvas viewport (`ViewportFrame`) uses fixed pixel widths. On very small laptop screens the 1600px wide view may force horizontal scrolling of the app chrome itself. Consider adding a CSS `scale()` transform for the canvas preview.

### Color Scheme & Typography Refinements
- **Unify chrome palette:** Extract the dark chrome colors (`#16181d`, `#23272f`, `#2e333d`, `#9aa1ad`) into CSS custom properties so the app background, borders, and text shades stay consistent.
- **Active-state tokens:** Use the theme accent (`#62D4FF`) for active viewport buttons and selected tree rows instead of subtle font-weight changes.
- **Inspector control styling:** Wrap native inputs in styled wrappers with dark backgrounds, matching the app chrome, to eliminate OS-level light dropdowns.

### Additional Quality-of-Life
- **Keyboard shortcuts:** Implement `Delete` (remove selected), `Ctrl/Cmd+Z` (undo), `Ctrl/Cmd+Shift+Z` (redo), `Esc` (deselect).
- **Search/filter tree:** Add a small search input above the tree to filter by widget type or ID.
- **Property groups:** Render inspector controls inside collapsible accordions keyed by `PropDescriptor.group`.
- **Icon font:** Load Material Symbols (or the chosen icon set) so the `Icon` widget renders the correct glyph instead of `◆`.
- **Reset-to-default:** Add a small "reset" icon next to each inspector control that reverts to the schema default.
- **Confirmation dialogs:** Show a modal before deleting a node or before reloading a screen (which would discard undo history).
- **Toast notifications:** Show a brief toast after "Export Changes Report" succeeds.

---

## Summary

The Design Studio core architecture (Zustand store, tree operations, diff engine, and report writer) is well-structured and covered by tests. The most impactful improvements are:

1. **Fix the unguarded schema parse** in `App.tsx` (crash on bad data).
2. **Reduce unnecessary re-renders** by using Zustand selectors in `Shell`, `Palette`, and `WidgetTree`.
3. **Add ARIA roles and keyboard navigation** to the Widget Tree and canvas.
4. **Implement styled controls** in the inspector so the dark theme is consistent.
5. **Address the missing icon font** so the canvas preview matches reality.

These changes would elevate the tool from a functional prototype to a polished, production-ready visual editor.
