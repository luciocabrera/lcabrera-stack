import type { EvalsRole } from './migrate.types.ts';

import { quoteIdentifier } from './quoteIdentifier.util.ts';

export const grantStatements = ({ grants, name }: EvalsRole) =>
  grants.map(
    ({ on, privileges }) =>
      `grant ${privileges} on ${on} to ${quoteIdentifier(name)}`,
  );
