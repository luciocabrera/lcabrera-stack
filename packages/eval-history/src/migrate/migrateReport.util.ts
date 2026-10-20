import type {
  EvalsRole,
  ExposedRole,
  Migration,
  UngrantedRole,
} from './migrate.types.ts';

import { exposedRoleLines } from './exposedRoleLines.util.ts';
import { MIGRATE_REPORT_PREFIX } from './migrate.constants.ts';
import { missingRoleLines } from './missingRoleLines.util.ts';
import { ungrantedRoleLines } from './ungrantedRoleLines.util.ts';

type MigrateReportArgs = {
  readonly applied: readonly Migration[];
  readonly exposed: readonly ExposedRole[];
  readonly granted: readonly EvalsRole[];
  readonly missing: readonly EvalsRole[];
  readonly pricesUpserted: number;
  readonly ungranted: readonly UngrantedRole[];
};

export const migrateReport = ({
  applied,
  exposed,
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
    ...exposed.flatMap((role) => exposedRoleLines(role)),
  ].join('\n');
