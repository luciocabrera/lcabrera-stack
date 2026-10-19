import type { ExposedRole } from './migrate.types.ts';

import { MIGRATE_REPORT_PREFIX } from './migrate.constants.ts';

export const exposedRoleLines = ({
  definerFunctions,
  definerViews,
  role,
}: ExposedRole) => [
  `${MIGRATE_REPORT_PREFIX} role ${role.name} can reach objects that run with their owner's privileges. The migrations above are applied and stay recorded; add a migration that gives each view security_invoker = true and drops security definer from each function:`,
  ...definerViews.map((name) => `  view ${name} without security_invoker`),
  ...definerFunctions.map((name) => `  function ${name} is security definer`),
];
