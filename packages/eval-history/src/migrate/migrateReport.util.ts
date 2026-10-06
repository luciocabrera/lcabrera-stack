import type { EvalsRole, Migration } from './migrate.types.ts';

import { roleSetupStatements } from './roleStatements.util.ts';

type MigrateReportArgs = {
  readonly applied: readonly Migration[];
  readonly granted: readonly EvalsRole[];
  readonly missing: readonly EvalsRole[];
  readonly pricesUpserted: number;
};

const PREFIX = 'evals:migrate:';

const missingRoleLines = (role: EvalsRole) => [
  `${PREFIX} role ${role.name} does not exist; create it, then run evals:migrate again:`,
  ...roleSetupStatements(role).map((statement) => `  ${statement};`),
];

export const migrateReport = ({
  applied,
  granted,
  missing,
  pricesUpserted,
}: MigrateReportArgs) =>
  [
    ...(applied.length === 0
      ? [`${PREFIX} already current`]
      : applied.map(({ name }) => `${PREFIX} applied ${name}`)),
    `${PREFIX} upserted ${String(pricesUpserted)} model prices`,
    ...granted.map(({ name }) => `${PREFIX} granted ${name}`),
    ...missing.flatMap((role) => missingRoleLines(role)),
  ].join('\n');
