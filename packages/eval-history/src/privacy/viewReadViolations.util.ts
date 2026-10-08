import { elementReads } from './elementReads.util.ts';
import { relationAliases } from './relationAliases.util.ts';
import { sqlTokens } from './sqlTokens.util.ts';
import { tokenFinding } from './tokenFinding.util.ts';

type ViewReadViolationsArgs = {
  readonly definition: string;
  readonly dependsOn: readonly string[];
  readonly fieldPaths: readonly string[];
  readonly guarded: readonly string[];
  readonly jsonbColumns: readonly string[];
};

export const viewReadViolations = ({
  definition,
  dependsOn,
  fieldPaths,
  guarded,
  jsonbColumns,
}: ViewReadViolationsArgs) => {
  const tokens = sqlTokens(definition);
  const tables = [
    ...new Set(guarded.map((column) => column.split('.', 1)[0] ?? '')),
  ];
  const guardedByName = new Map(
    guarded.map((column) => [column.split('.', 2)[1] ?? column, column]),
  );
  const { aliases, declarations, declared, problems } = relationAliases({
    tables,
    tokens,
  });
  const findings = tokens.flatMap((_, index) =>
    tokenFinding({
      aliases,
      declarations,
      guardedByName,
      index,
      jsonbColumns,
      tokens,
    }),
  );
  const reads = [
    ...findings.flatMap((finding) =>
      finding.kind === 'read' ? [finding.path] : [],
    ),
    ...findings.flatMap((finding) =>
      finding.kind === 'source'
        ? elementReads({ source: finding.source, tokens })
        : [],
    ),
  ];

  return {
    reads: [...new Set(reads)],
    violations: [
      ...new Set([
        ...problems,
        ...dependsOn
          .filter((table) => tables.includes(table) && !declared.has(table))
          .map(
            (table) =>
              `evals.${table} is read in a form the check cannot follow`,
          ),
        ...findings.flatMap((finding) =>
          finding.kind === 'violation' ? [finding.text] : [],
        ),
        ...reads.filter((read) => !fieldPaths.includes(read)),
      ]),
    ],
  };
};
