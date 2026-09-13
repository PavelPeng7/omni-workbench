# Knowledge-note templates

Omni Workbench provides one configurable Markdown template for each knowledge-note type: fleeting, literature, and permanent. Use the corresponding template-path settings to match your vault structure.

During conversion, the complete original Markdown body replaces the single `{{content}}` placeholder. If a template omits it, the body is appended once. Do not use the placeholder more than once; conversion rejects that template to prevent duplicated note content.

**Check and complete** creates only missing starter templates. It never overwrites an existing file, and a configured template path must be a unique `.md` file path rather than a folder.
