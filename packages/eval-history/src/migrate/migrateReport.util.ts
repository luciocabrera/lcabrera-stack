import type { EvalsRole, Migration, UngrantedRole } from './migrate.types.ts';

import { MIGRATE_REPORT_PREFIX } from './migrate.constants.ts';
import { missingRoleLines } from './missingRoleLines.util.ts';
import { ungrantedRoleLines } from './ungrantedRoleLines.util.ts';

type MigrateReportArgs = {
  readonly applied: readonly Migration[];
  readonly granted: readonly EvalsRole[];
  readonly missing: readonly EvalsRole[];
  readonly pricesUpserted: number;
  readonly ungranted: readonly UngrantedRole[];
};

export const migrateReport = ({
  applied,
  granted,
  missing,
  pricesUpserted,
  ungranted,
}: MigrateReportArgs) =>
  [
    ...(applied.length === 0
      ? [`${MIGRATE_REPORT_PREFIX} already current`]
      : applied.map(({ name }) => `${MIGRATE_REPORT_PREFIX} applied ${name}`)),
    `${MIGRATE_REPORT_PREFIX} upserted ${String(pricesUpserted)} model prices`,
    ...granted.map(({ name }) => `${MIGRATE_REPORT_PREFIX} granted ${name}`),
    ...ungranted.flatMap((role) => ungrantedRoleLines(role)),
    ...missing.flatMap((role) => missingRoleLines(role)),
  ].join('\n');
