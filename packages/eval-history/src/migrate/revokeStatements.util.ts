import type { EvalsRole } from './migrate.types.ts';

import { PUBLIC_COLUMNS_TARGET, VIEWS_TARGET } from './migrate.constants.ts';
import { quoteIdentifier } from './quoteIdentifier.util.ts';

const revokeTarget = (on: string) => {
  const viewsSchema = VIEWS_TARGET.exec(on)?.[1];

  if (viewsSchema) {
    return `all tables in schema ${viewsSchema}`;
  }

  return on === PUBLIC_COLUMNS_TARGET ? 'all tables in schema evals' : on;
};

export const revokeStatements = ({ grants, name }: EvalsRole) => [
  ...new Set(
    grants.map(
      ({ on }) =>
        `revoke all on ${revokeTarget(on)} from ${quoteIdentifier(name)}`,
    ),
  ),
];
