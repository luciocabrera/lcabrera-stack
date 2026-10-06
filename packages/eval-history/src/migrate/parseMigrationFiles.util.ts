import type { HashedFile } from '../hashing/hashing.types.ts';

import { toMigration } from './toMigration.util.ts';

export const parseMigrationFiles = (files: readonly HashedFile[]) => {
  const migrations = files
    .filter(({ path }) => path.endsWith('.sql'))
    .map((file) => toMigration(file))
    .toSorted((left, right) => left.version - right.version);
  const duplicate = migrations.find(
    (migration, index) => migrations[index - 1]?.version === migration.version,
  );

  if (duplicate) {
    throw new Error(
      `Two migration files share version ${String(duplicate.version)}, one of them "${duplicate.name}"`,
    );
  }

  return migrations;
};
