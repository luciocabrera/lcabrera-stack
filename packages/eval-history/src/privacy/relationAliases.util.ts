import type { SqlToken } from './privacy.types.ts';

import { isClauseEnd } from './isClauseEnd.util.ts';

type RelationAliasesArgs = {
  readonly tables: readonly string[];
  readonly tokens: readonly SqlToken[];
};

export const relationAliases = ({ tables, tokens }: RelationAliasesArgs) => {
  const aliases = new Map<string, string[]>();
  const declarations = new Set<number>();
  const declared = new Set<string>();
  const problems: string[] = [];

  for (const [index, token] of tokens.entries()) {
    const table = tokens[index + 2];

    if (
      table === undefined ||
      token.quoted ||
      token.kind !== 'identifier' ||
      token.value !== 'evals' ||
      tokens[index + 1]?.value !== '.' ||
      !tables.includes(table.value)
    ) {
      continue;
    }

    const next = tokens[index + 3];
    const aliasAt = index + (isClauseEnd(next) ? 2 : 3);
    const alias = tokens[aliasAt];

    declared.add(table.value);

    if (alias?.kind !== 'identifier') {
      problems.push(`evals.${table.value} has an alias the check cannot read`);
    } else if (tokens[aliasAt + 1]?.value === '(' && aliasAt !== index + 2) {
      problems.push(`evals.${table.value} ${alias.value} renames its columns`);
    } else {
      declarations.add(aliasAt);
      aliases.set(alias.value, [
        ...(aliases.get(alias.value) ?? []),
        table.value,
      ]);
    }
  }

  return { aliases, declarations, declared, problems };
};
