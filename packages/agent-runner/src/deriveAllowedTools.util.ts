type DeriveAllowedToolsArgs = {
  readonly frontmatter: Record<string, string>;
};

/**
 * Splits a SKILL.md `allowed-tools:` frontmatter string into individual
 * entries matching `.claude/settings.json`'s permissions.allow convention
 * — one pattern per array entry (`"Bash(vp fmt*)"`, `"Bash(vp lint*)"`,
 * ...), never a comma-joined group.
 *
 * SKILL.md frontmatter itself uses a DIFFERENT, condensed notation:
 * `Bash(cat:*,date:*,git:*,mkdir:*,node:*,tee:*)` groups every allowed
 * bash-command prefix into one parenthesized, comma-joined list. Passing
 * that whole string through as a single allowedTools entry is a real bug,
 * caught only by a live Agent SDK run: `query()`'s permission matcher
 * doesn't understand the condensed form and denies everything, including
 * a bare `mkdir -p <path>` that should have been covered by `mkdir:*`.
 * This expands `Tool(a:*,b:*,c:*)` into `Tool(a:*)`, `Tool(b:*)`,
 * `Tool(c:*)` — one real entry per pattern.
 */
export const deriveAllowedTools = ({
  frontmatter,
}: DeriveAllowedToolsArgs): readonly string[] => {
  const raw = frontmatter['allowed-tools'];
  if (!raw) return [];

  const groupedEntries: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of raw) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;

    if (char === ',' && depth === 0) {
      groupedEntries.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) groupedEntries.push(current.trim());

  return groupedEntries.flatMap((entry) => {
    const match = /^(\w+)\(([^)]*)\)$/.exec(entry);
    if (!match) return [entry];

    const [, toolName, patternList] = match;
    return (patternList ?? '')
      .split(',')
      .map((pattern) => pattern.trim())
      .filter((pattern) => pattern.length > 0)
      .map((pattern) => `${toolName}(${pattern})`);
  });
};
