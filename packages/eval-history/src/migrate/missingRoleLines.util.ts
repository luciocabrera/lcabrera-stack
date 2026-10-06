import type { EvalsRole } from './migrate.types.ts';

import { MIGRATE_REPORT_PREFIX } from './migrate.constants.ts';
import { roleSetupStatements } from './roleSetupStatements.util.ts';

export const missingRoleLines = (role: EvalsRole) => [
  `${MIGRATE_REPORT_PREFIX} role ${role.name} does not exist; create it, then run evals:migrate again:`,
  ...roleSetupStatements(role).map((statement) => `  ${statement};`),
];
