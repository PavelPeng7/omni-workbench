# Release smoke checklist

Run after `npm run release:check` and before publishing.

## Desktop

- Enable or reload Omni Workbench without console errors.
- Open the workbench and switch among home, task, and knowledge tabs.
- Start, pause, and resume a timer; confirm elapsed and remaining time survive a reload.
- Create or edit a task and confirm configured frontmatter fields are preserved.
- Open and close the view; confirm timers, event listeners, and injected runtime styles do not duplicate.
- Check keyboard focus, light and dark themes, and popout-window behavior.

## Mobile

- Enable the plugin and open every workbench tab.
- Confirm touch targets, scrolling, modal editing, and timer updates work without desktop-only APIs.
- Reload the plugin and confirm settings and task data remain intact.
