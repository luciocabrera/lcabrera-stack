import type { EvalsRole, RoleGrant } from './migrate.types.ts';

import { quoteIdentifier } from './quoteIdentifier.util.ts';

const privilegeList = ({ columns, privileges }: RoleGrant) => {
  if (columns === undefined) {
    return privileges;
  }

  const columnList = columns
    .map((column) => quoteIdentifier(column))
    .join(', ');

  return privileges
    .split(',')
    .map((privilege) => `${privilege.trim()} (${columnList})`)
    .join(', ');
};

export const grantStatements = ({ grants, name }: EvalsRole) =>
  grants.map(
    (grant) =>
      `grant ${privilegeList(grant)} on ${grant.on} to ${quoteIdentifier(name)}`,
  );
