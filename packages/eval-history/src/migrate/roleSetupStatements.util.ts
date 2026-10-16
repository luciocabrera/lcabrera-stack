import type { EvalsRole } from './migrate.types.ts';

import { grantStatements } from './grantStatements.util.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

export const roleSetupStatements = (role: EvalsRole) => [
  `create role ${quoteIdentifier(role.name)} login`,
  ...grantStatements(role),
];
