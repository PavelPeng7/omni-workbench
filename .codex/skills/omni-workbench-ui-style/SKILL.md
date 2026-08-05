---
name: omni-workbench-ui-style
description: Apply Omni Workbench's high-fidelity Claymorphism design system to any UI addition, removal, or modification. Use when changing the Obsidian plugin's interface markup, UI state, controls, layouts, or styles, especially main.js and styles.css.
---

# Omni Workbench UI Style

Create interfaces that feel like premium digital clay: soft, tactile, buoyant, and accessible. Preserve the existing `.pvd-*` naming convention and CSS-first implementation; this is a vanilla Obsidian plugin, not a Tailwind or component-library project.

## Required workflow

1. Inspect the affected markup in `main.js` and the relevant `.pvd-*` rules in `styles.css` before changing code. Reuse existing structures, tokens, and interaction conventions.
2. Build the smallest coherent UI change. Add a semantic, scoped `.pvd-*` class rather than inline visual styles or a global selector.
3. Use the canonical Claymorphism tokens and component rules in [references/claymorphism.md](references/claymorphism.md). Keep token declarations centralized in `.pvd-root`.
4. Implement every interactive state: default, hover, `:active`, `:focus-visible`, disabled where applicable, and selected/active state when applicable.
5. Verify responsive layout, keyboard operation, readable contrast, and `prefers-reduced-motion`. Run `npm run release:check` after UI code changes.

## Implementation rules

- Scope all selectors under `.pvd-root`; use the existing `pvd-` prefix for new classes.
- Reuse `--pvd-*` tokens, `--pvd-shadow-card`, `--pvd-shadow-raised`, and `--pvd-shadow-pressed`. Add a token only when a semantic role cannot be expressed by an existing one.
- Use `Nunito` for headings, numbers, and labels; use the existing body stack for paragraphs and form text. Keep primary text at `--pvd-ink` and secondary text no lighter than `--pvd-muted`.
- Make elevated cards glass-clay surfaces: generous radius, translucent light background, layered shadow, and a restrained hover lift. Make inputs and segmented controls recessed.
- Give buttons a minimum 44px target, rounded shape, hover lift, pressed squish, and visible keyboard focus. Reserve the violet gradient for primary actions.
- Use color to communicate state, but never as the only signal. Keep destructive actions visually distinct and require the existing safe behavior/confirmation pattern.
- Keep motion subtle (200–500 ms for interaction; 8–12 s for ambient decoration) and disable nonessential motion under reduced-motion preferences.
- Preserve source order and use the existing responsive breakpoints/patterns. Do not flatten the visual language into sharp, generic, or Notion-style controls.

## UI removal rules

When removing an interface element, remove its now-unused event handling, state, and scoped CSS in the same change. Do not disturb shared tokens or shared component rules still used elsewhere. Re-check nearby grid/flex layouts at narrow widths after the removal.

## Completion checklist

- [ ] New UI is scoped with semantic `.pvd-*` selectors and has no duplicated one-off token values.
- [ ] The component reads as Claymorphism: soft canvas, round silhouette, layered depth, and tactile interaction.
- [ ] All states are accessible by pointer and keyboard, with readable text and adequate target size.
- [ ] Responsive and reduced-motion behavior remain correct.
- [ ] `npm run release:check` passes.
