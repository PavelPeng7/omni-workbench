# Knowledge-note templates

Omni Workbench provides one configurable Markdown template for each knowledge-note type: fleeting, literature, and permanent. Use the corresponding template-path settings to match your vault structure.

During conversion, Omni Workbench applies the target template's frontmatter only. It discards the template body, including headings, prose, prompts, and `{{content}}`, and preserves the complete original Markdown body unchanged.

**Check and complete** creates only missing starter templates. It never overwrites an existing file, and a configured template path must be a unique `.md` file path rather than a folder.
