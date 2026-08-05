# Project instructions

## UI changes

For every addition, removal, or modification of visible plugin UI, use the project skill at `.codex/skills/omni-workbench-ui-style/SKILL.md` before editing `main.js` or `styles.css`. Read its referenced Claymorphism guide when implementing visual styles.

The final interface must preserve Omni Workbench's high-fidelity Claymorphism theme: scoped `.pvd-*` CSS, centralized `--pvd-*` tokens, soft rounded surfaces, layered tactile shadows, accessible interaction states, and responsive/reduced-motion behavior. Do not introduce flat, sharp-cornered, or Notion-style visual overrides.

## General development

- Keep changes targeted and maintainable.
- Run `npm run release:check` after changes to release artifacts.
