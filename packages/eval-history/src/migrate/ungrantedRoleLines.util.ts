import type { UngrantedRole } from './migrate.types.ts';

import { MIGRATE_REPORT_PREFIX } from './migrate.constants.ts';

export const ungrantedRoleLines = ({ lacking, role }: UngrantedRole) => [
  `${MIGRATE_REPORT_PREFIX} role ${role.name} still lacks these privileges after the grant; run evals:migrate as the role that owns the evals objects:`,
  ...lacking.map(({ object, privilege }) => `  ${privilege} on ${object}`),
];
