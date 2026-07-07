type CollectToolInputPathsArgs = {
  readonly toolInput: unknown;
  readonly toolName: string;
};

// Which input fields carry path-like strings, per tool. Grep's `pattern`
// is deliberately absent — it is a CONTENT regex (searching source for the
// string ".env" is legitimate); its `glob`/`path` fields are the path-like
// ones. Glob's `pattern` IS a path pattern.
const PATH_FIELDS_BY_TOOL: Readonly<Record<string, readonly string[]>> = {
  Glob: ['path', 'pattern'],
  Grep: ['glob', 'path'],
  Read: ['file_path'],
};

const GLOB_WILDCARDS = /[*?[\]]/g;
const BASH_SEPARATORS = /[\s"'`;|&<>()]+/;

/**
 * Extracts every path-like string from a tool call's input so the secret
 * guard (ADR-020) can test each one. Bash commands are tokenized on shell
 * separators and `=` (catching `--env-file=.env` style flags); glob
 * wildcards are stripped so a dotenv-targeting pattern reduces to the
 * `.env` basename it targets. Tools not listed (Write is already scoped by
 * canUseTool) yield no candidates.
 */
export const collectToolInputPaths = ({
  toolInput,
  toolName,
}: CollectToolInputPathsArgs): readonly string[] => {
  if (toolInput === null || typeof toolInput !== 'object') {
    return [];
  }
  const input = toolInput as Record<string, unknown>;

  if (toolName === 'Bash') {
    const command = typeof input.command === 'string' ? input.command : '';
    return command
      .split(BASH_SEPARATORS)
      .flatMap((token) => token.split('='))
      .filter((fragment) => fragment.length > 0);
  }

  const pathFields = PATH_FIELDS_BY_TOOL[toolName] ?? [];
  return pathFields.flatMap((field) => {
    const value = input[field];
    return typeof value === 'string'
      ? [value.replaceAll(GLOB_WILDCARDS, '')]
      : [];
  });
};
