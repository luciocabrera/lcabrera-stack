import type { EvalsRole } from './migrate.types.ts';

const quoteIdentifier = (name: string) => `"${name.replaceAll('"', '""')}"`;

export const grantStatements = ({ grants, name }: EvalsRole) =>
  grants.map(
    ({ on, privileges }) =>
      `grant ${privileges} on ${on} to ${quoteIdentifier(name)}`,
  );

export const roleSetupStatements = (role: EvalsRole) => [
  `create role ${quoteIdentifier(role.name)} login`,
  ...grantStatements(role),
];
