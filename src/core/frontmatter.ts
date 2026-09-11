export function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function setFrontmatterField(source: string, field: string, value: string | number): string {
  const pattern = new RegExp(`^(${escapeRegExp(field)}\\s*:).*$`, "m");
  if (pattern.test(source)) return source.replace(pattern, (_match, prefix: string) => `${prefix} ${value}`);

  return source.replace(
    /^---\r?\n([\s\S]*?)\r?\n---/,
    (_match, body: string) => `---\n${body}\n${field}: ${value}\n---`,
  );
}
