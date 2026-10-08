import type { EvalsRole } from './migrate.types.ts';

import { quoteIdentifier } from './quoteIdentifier.util.ts';

export const revokeStatements = ({ grants, name }: EvalsRole) =>
  grants.map(({ on }) => `revoke all on ${on} from ${quoteIdentifier(name)}`);
