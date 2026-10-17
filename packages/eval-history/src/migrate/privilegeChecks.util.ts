import type { EvalsRole } from './migrate.types.ts';

const SCHEMA_TARGET = /^schema (\w+)$/;
const TABLES_TARGET = /^all tables in schema (\w+)$/;

const checkTarget = (on: string) => {
  const schema = SCHEMA_TARGET.exec(on)?.[1];

  if (schema) {
    return { kind: 'schema', schema } as const;
  }

  const tablesSchema = TABLES_TARGET.exec(on)?.[1];

  if (tablesSchema) {
    return { kind: 'tables', schema: tablesSchema } as const;
  }

  throw new Error(
    `evals:migrate: cannot check a grant on "${on}"; only "schema <name>" and "all tables in schema <name>" are checked`,
  );
};

export const privilegeChecks = ({ grants }: EvalsRole) =>
  grants.flatMap(({ on, privileges }) => {
    const target = checkTarget(on);

    return privileges
      .split(',')
      .map((privilege) => privilege.trim())
      .filter((privilege) => privilege.length > 0)
      .map((privilege) => ({ ...target, privilege }));
  });
