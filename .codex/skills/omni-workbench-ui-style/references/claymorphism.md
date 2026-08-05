# Claymorphism reference

## Canonical tokens

Use the values already declared on `.pvd-root` in `styles.css`:

| Role | Token / value |
| --- | --- |
| Canvas | `--pvd-canvas` (`#f4f1fa`) |
| Primary text | `--pvd-ink` (`#332f3a`) |
| Muted text | `--pvd-muted` (`#635f69`) |
| Primary action | `--pvd-violet` / `--pvd-violet-light` |
| Supporting accents | `--pvd-pink`, `--pvd-sky`, `--pvd-green`, `--pvd-amber` |
| Glass card | `--pvd-card` |
| Elevated card | `--pvd-shadow-card` |
| Raised control | `--pvd-shadow-raised` |
| Recessed control | `--pvd-shadow-pressed` |

Never use pure black, pure-white page backgrounds, low-contrast gray copy, sharp corners, or a flat shadow as a substitute for the tokenized depth system.

## Surface hierarchy

| Element | Treatment |
| --- | --- |
| Page / shell | Lavender canvas with soft blurred accent blobs; ambient motion only. |
| Main panel | 48–60px radius, translucent white, deep four-layer surface shadow. |
| Card | 30–34px radius, translucent white, `--pvd-shadow-card`, 4px hover lift. |
| Compact item | 20–28px radius, lighter layered shadow, 2–4px hover lift. |
| Input / selected segment | Recessed pale-lavender surface with `--pvd-shadow-pressed`. |
| Primary CTA | Violet gradient, `--pvd-shadow-raised`, white text. |

Nested surfaces step down in radius; for example, 34px card -> 24px inner panel -> 16–20px control. Do not use radii below 16px except compact, non-primary internal metadata.

## Interaction rules

```css
.pvd-example-control {
  min-height: 44px;
  border: 0;
  border-radius: 20px;
  box-shadow: var(--pvd-shadow-raised);
  transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
}
.pvd-example-control:hover { transform: translateY(-4px); }
.pvd-example-control:active {
  transform: translateY(1px) scale(.92);
  box-shadow: var(--pvd-shadow-pressed);
}
.pvd-example-control:focus-visible {
  outline: 0;
  box-shadow: var(--pvd-shadow-raised), 0 0 0 4px rgba(124,58,237,.30);
}
```

Cards transition more slowly (about 450ms); buttons and inputs use about 200ms. Use `cursor: pointer` only for actual controls.

## Typography and layout

- Headings, numeric values, and labels: `Nunito`, weight 800–900, tight tracking for headings.
- Body: existing `DM Sans` stack, relaxed line-height, readable at 14–16px or above.
- Prefer an asymmetric/bento composition where it helps comprehension; do not force every card into the same size.
- Keep mobile layouts single-column or gracefully wrapping. Retain generous radii and depth, reduce padding before reducing targets.

## Accessibility and motion

- Never rely on color alone for priority, completion, validation, or selection.
- Keep text contrast at least WCAG AA; muted copy must remain `--pvd-muted` or darker.
- Provide an explicit label or accessible name for icon-only controls.
- Include this rule when adding new animation:

```css
@media (prefers-reduced-motion: reduce) {
  .pvd-new-animated-element { animation: none; transition: none; }
}
```
