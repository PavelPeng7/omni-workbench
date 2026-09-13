# Convert Markdown files between knowledge-note types

## Status

Proposed on 2026-09-13. The product behavior was clarified with the user; the testing seam and remote issue draft still require publication confirmation.

## Problem Statement

Omni Workbench already organizes knowledge into fleeting notes, literature notes, and permanent notes, but a user cannot take an arbitrary Markdown file from either the Workbench note list or Obsidian's native file explorer and convert it into one of those types through a consistent workflow. The existing fleeting-note triage can move a fleeting note to the literature or permanent folder, but it is limited to that screen, does not support conversion in every direction, does not apply a target note template, silently chooses a unique name on collision, and is not available from Obsidian's file menu.

The user needs conversion to preserve the original file name, frontmatter information, and complete Markdown body while applying the selected type's format and moving the same file into the configured knowledge folder. Because conversion rewrites and moves a file, errors or accidental clicks must not overwrite another note or leave the source partially converted.

## Solution

Add a shared **Convert to note type** workflow for Markdown files. It is available from both Omni Workbench knowledge-note lists and Obsidian's native file explorer as a submenu with fleeting, literature, and permanent destinations. The current type is omitted, non-Markdown entries are excluded, and the user sees a confirmation dialog containing the source path, destination path, and selected type before any mutation.

Each type has a dedicated configurable Markdown template created by one-click setup without overwriting an existing template. Conversion parses the source and template frontmatter, applies target-owned type fields from the template, preserves source-owned metadata, merges list fields such as tags without duplicates, and inserts the complete source body into the template's `{{content}}` placeholder. If the placeholder is absent, the source body is appended once to the template body. The same file is then moved, through Obsidian's file-management API, to the already configured folder with its original file name.

All validation occurs before mutation. Invalid YAML, a missing or unreadable template, an invalid target configuration, or an existing destination file blocks conversion and leaves the source unchanged. Successful and failed operations produce clear notices and refresh affected Workbench views.

## User Stories

1. As an Obsidian user, I want to convert an arbitrary Markdown file into a fleeting note, so that an unclassified thought enters my capture workflow without manual restructuring.
2. As an Obsidian user, I want to convert an arbitrary Markdown file into a literature note, so that material tied to an external source adopts the correct knowledge workflow.
3. As an Obsidian user, I want to convert an arbitrary Markdown file into a permanent note, so that a reusable conclusion adopts the correct knowledge workflow.
4. As a Workbench user, I want the conversion command in the Workbench knowledge-note lists, so that I do not have to leave the Workbench to organize a note.
5. As an Obsidian user, I want the same conversion command in the native file explorer, so that I can organize files where I already browse my vault.
6. As a user of both entry points, I want them to run the same conversion behavior, so that results do not depend on where I opened the menu.
7. As a user, I want the three destinations grouped under one **Convert to note type** submenu, so that the context menu remains compact.
8. As a user, I want conversion actions to appear only for Markdown files, so that unsupported files and folders do not offer misleading commands.
9. As a keyboard user, I want to open the Workbench context menu with the keyboard and operate every conversion action, so that the feature is not pointer-only.
10. As a user, I want my file name to remain unchanged, so that the note keeps its recognizable identity.
11. As a user, I want the converted file moved rather than copied, so that conversion does not leave duplicate notes behind.
12. As a user, I want the original location to contain no copy after success, so that the same note has one authoritative location.
13. As a user, I want the complete original Markdown body migrated into the target template, so that conversion does not discard my writing.
14. As a template author, I want a documented `{{content}}` placeholder, so that I control where migrated content appears.
15. As a template author, I want source content appended when I omit `{{content}}`, so that a valid template cannot accidentally drop the note body.
16. As a user, I want the source body inserted exactly once, so that conversion does not duplicate my writing.
17. As a user, I want each knowledge-note type to have its own template, so that fleeting, literature, and permanent notes can have distinct formats.
18. As a new user, I want one-click setup to create starter knowledge-note templates, so that conversion works with the recommended workspace.
19. As an existing user, I want setup to preserve any existing template file, so that updating Omni Workbench never overwrites my format.
20. As an advanced user, I want each knowledge-note template path to be configurable, so that conversion can match my vault conventions.
21. As a user, I want the target template's type and workflow-status values to win, so that the converted file is recognized as the selected type.
22. As a user, I want my title, aliases, tags, source, and creation date preserved where possible, so that important identity and provenance survive conversion.
23. As a user, I want tags and other list metadata merged without duplicates, so that neither source nor template classification is lost.
24. As a user, I want custom source frontmatter fields preserved, so that conversion does not erase plugin-specific or personal metadata.
25. As a user, I want template defaults added for fields absent from the source, so that the new format is complete without overwriting useful source values.
26. As a user, I want the note's configured folder to be the authoritative signal of its current type, so that menu behavior matches where Omni Workbench organizes notes.
27. As a user, I want the `type` frontmatter value used only as a fallback outside configured folders, so that an unfiled but typed note is still understood.
28. As a user, I want to convert a note from any knowledge type to either of the other two, so that the workflow supports reclassification.
29. As a user, I want the current type omitted from the submenu, so that I cannot run a meaningless self-conversion.
30. As a cautious user, I want to see source path, destination path, and selected type before conversion, so that I can catch a mistaken action.
31. As a user, I want conversion to stop when the target already contains the same file name, so that no file is overwritten or silently renamed.
32. As a user, I want invalid source or template YAML reported before any write or move, so that malformed metadata cannot cause data loss.
33. As a user, I want a missing or unreadable target template reported before any write or move, so that conversion never produces an undefined format.
34. As a user, I want invalid or overlapping folder configuration reported clearly, so that a setup problem does not masquerade as a successful conversion.
35. As a user, I want file moves to use Obsidian's file-management API, so that automatic internal-link updates follow my Obsidian setting.
36. As a user with fleeting notes linked to tasks, I want those relationships preserved after conversion, so that the existing triage workflow does not regress.
37. As a user, I want a success notice naming the resulting type and destination, so that I know the conversion completed.
38. As a user, I want actionable failure notices, so that I can correct a template, YAML, or collision problem without inspecting logs.
39. As a Workbench user, I want affected knowledge lists refreshed after conversion, so that the note immediately appears in the correct lane and search results.
40. As a mobile Obsidian user, I want the context action and confirmation dialog to remain usable at narrow widths, so that the feature respects the plugin's desktop-and-mobile contract.

## Implementation Decisions

- Model the supported targets as three knowledge-note descriptors: fleeting note, literature note, and permanent note. Each descriptor owns its configured folder, template setting, canonical `type` value, canonical workflow status, localized labels, and success message.
- Introduce one typed, runtime-independent conversion planner as the primary behavior seam. Given the source path and content, source metadata, target descriptor and template, configured type folders, conversion date, and destination occupancy, it returns either a complete conversion plan or a typed failure. It does not call Obsidian, browser, or filesystem APIs.
- Keep persistence in a thin Obsidian adapter. The adapter reads the source and template, asks the planner for a complete plan, ensures the configured target folder exists, writes the planned content, and moves the same file through Obsidian's file manager.
- Preflight source type, template availability, YAML parsing, target folder configuration, destination path, and destination collision before modifying the source.
- Preserve the original base file name and extension. The destination is the selected type's configured folder plus the original file name. Do not reuse the existing unique-name behavior for this workflow.
- Treat a destination occupied by any other file or folder as a hard conflict. Abort with no overwrite and no automatic numeric suffix.
- Determine current type first by membership in a configured type folder. If the file is outside all three folders, use a recognized `type` frontmatter value as fallback. If folder and frontmatter disagree, the folder wins.
- Do not offer the target matching the current type. A Markdown file outside the configured folders may offer all three targets.
- Add one configurable Markdown template per knowledge-note type. One-click setup creates starter templates only when absent and never overwrites an existing vault entry. Existing installations can use **Check and complete** to add newly introduced starter templates.
- Make `{{content}}` the documented migrated-body placeholder. Replace every valid conversion template's single placeholder with the complete source body. Reject templates containing more than one `{{content}}` placeholder because the body must not be duplicated. If the placeholder is absent, append the source body once after the template body with normalized boundary newlines.
- Preserve the source body as Markdown content excluding its leading frontmatter block. Do not summarize, rewrite, or semantically edit it during conversion.
- Parse both source and template frontmatter before merging. The target template is authoritative for `type`, workflow status, conversion/processing date placeholders, and any future fields explicitly declared as type-owned by the descriptor.
- Preserve source title, aliases, tags, source/provenance, creation date, and all other custom source fields. For non-type-owned scalar conflicts, the source value wins; template values supply defaults only when the source omits the field.
- Merge array-valued fields, including `tags` and `aliases`, in stable source-first order and remove duplicates using exact normalized values. A scalar source value and an array template value are normalized into one list before merging when the field is list-shaped.
- Render documented scalar placeholders such as the conversion date in template-owned values without evaluating arbitrary code or third-party template syntax.
- Retain the existing canonical values: fleeting notes use `type: 闪念笔记` and status `收集`; literature notes use `type: 文献笔记` and status `待整理`; permanent notes use `type: 永久笔记` and status `已沉淀`.
- Route the existing fleeting-note **Make permanent** and **Archive source** actions through the same shared conversion workflow so that collision, template, metadata, and content rules are consistent everywhere.
- Preserve existing source-task relationship behavior when converting a linked fleeting note. The workflow must not leave a stale Workbench-owned relationship if Obsidian automatic link updating is disabled.
- Register Obsidian's native file-menu event during plugin load and unregister it through the plugin lifecycle. Use Obsidian's native menu and submenu components rather than custom global menu styling.
- Replace Workbench's direct right-click-only editing behavior on applicable note cards with a shared context menu that preserves existing edit/open actions and adds the conversion submenu. Provide `ContextMenu` and `Shift+F10` keyboard activation on focusable note controls.
- Use the existing Claymorphism-styled confirmation modal pattern, with source path, destination path, selected target type, cancel, and a clearly labeled primary conversion action. Reuse scoped `.pvd-*` structures and tokens if any new modal markup or styling is necessary.
- Localize all new visible labels, confirmation copy, success messages, and errors in the plugin's existing presentation-only localization system. Persisted folder paths and frontmatter values remain language-independent and are not rewritten when the interface language changes.
- Execute mutation as a compensated two-step operation because Obsidian does not provide a cross-file transaction. If content writing succeeds but moving fails, attempt to restore the original content and report the failure. Never report success until both content and location match the plan.
- Let Obsidian's file manager honor the user's automatic internal-link update setting for ordinary links. Do not globally rewrite Markdown links independently of Obsidian.
- Refresh open Workbench views after success. On a preflight failure, leave the source unchanged and show an actionable notice; refreshing is not required unless external state changed.
- This feature adds persisted template-path settings and a stable template placeholder contract. The accompanying architecture decision record documents that compatibility boundary.

## Testing Decisions

- Prefer one high-level pure conversion-planner seam over separate tests for parsing, merging, templating, type detection, and collision naming. Tests should provide complete source/template/configuration inputs and assert only the externally meaningful plan or failure.
- Planner tests will cover conversion into each of the three types, including canonical target type and status, unchanged file name, configured target path, complete body migration, and the target content that will be written.
- Planner tests will cover a source with no frontmatter, source-only fields, template-only defaults, scalar conflicts, type-owned conflicts, tags and aliases represented as scalars or arrays, stable deduplication, and Unicode/Chinese values.
- Planner tests will cover insertion at one `{{content}}` placeholder, append-on-no-placeholder behavior, rejection of multiple placeholders, and body preservation without duplication.
- Planner tests will cover current-type detection by configured folder, fallback detection by `type`, folder precedence over conflicting `type`, and omission of the current target.
- Planner tests will cover occupied destinations, missing templates, unreadable/invalid source YAML, invalid template YAML, unsupported extensions, and invalid or overlapping target-folder configuration. Every failure assertion includes that no executable mutation plan was returned.
- Thin adapter tests, if the repository's Obsidian mocks can express them without creating a second broad seam, will assert call order and compensation only at the public workflow boundary: all reads and conflict checks precede writes, success writes then moves once, preflight failure performs no mutation, and move failure attempts content restoration.
- Menu construction tests should assert observable menu labels and available destinations for an ordinary note and for each current type. They should not assert private helper calls or DOM implementation details.
- Existing frontmatter unit tests are the closest prior art for strict, runtime-independent Markdown transformations. Extend their behavioral style while moving conversion-specific assertions to the higher planner seam.
- Manual release smoke coverage will verify the native file explorer and Workbench entry points in real desktop Obsidian, keyboard activation, confirmation copy, cancellation, collision and YAML error notices, current-type omission, link-update behavior with Obsidian's setting both enabled and disabled, and responsive confirmation UI on mobile/narrow layouts.
- Completion requires the repository release quality gate and review against repository standards, this specification, and the Claymorphism UI rules.

## Out of Scope

- Batch conversion of multiple selected files.
- Conversion of folders, attachments, canvases, Bases files, or any non-Markdown entry.
- Conversion of files outside the current Obsidian vault.
- Automatic classification or suggestions about which note type to choose.
- Overwriting, merging with, deleting, or automatically renaming an existing destination file.
- Keeping a copy at the original location.
- Renaming the converted file or rewriting its prose.
- Adding user-defined note types beyond fleeting, literature, and permanent notes.
- Executing arbitrary Templater, Dataview, JavaScript, or third-party template expressions.
- A general undo history beyond Obsidian's existing file and link behavior plus best-effort compensation for an execution failure.
- Changing the existing fleeting-note-to-task or discard workflows except where shared menu behavior must preserve their current entry points.
- A broad rewrite of the legacy plugin entry or a redesign of Workbench surfaces.

## Further Notes

- Repository inspection found an existing fleeting-note conversion that updates `type`, status, and processing date before moving to a unique destination. This feature supersedes that narrow path with the shared planner and changes collision behavior from silent suffixing to a hard stop.
- Repository inspection also found only a task template setting and task starter template. The three knowledge-note templates described here are new product assets required to satisfy the agreed target-format and body-migration behavior.
- The configured folders remain the location boundary owned by Omni Workbench; Obsidian continues to own vault persistence, metadata caching, link updates, and plugin lifecycle cleanup.
- The required `ready-for-agent` label does not currently exist in the GitHub repository. Creating the label and remote issue must follow explicit confirmation of the proposed draft under the repository's issue-tracker rules.
