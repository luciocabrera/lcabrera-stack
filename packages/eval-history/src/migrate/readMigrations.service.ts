import { fileURLToPath } from 'node:url';

import type { HashingFileSystem } from '../hashing/hashing.types.ts';

import { readFileSet } from '../hashing/readFileSet.service.ts';
import { MIGRATIONS_DIRECTORY } from './migrate.constants.ts';
import { parseMigrationFiles } from './parseMigrationFiles.util.ts';

type ReadMigrationsArgs = {
  readonly directory?: string;
  readonly fileSystem?: HashingFileSystem;
};

export const readMigrations = async ({
  directory = fileURLToPath(MIGRATIONS_DIRECTORY),
  fileSystem,
}: ReadMigrationsArgs = {}) =>
  parseMigrationFiles(await readFileSet({ directory, fileSystem }));
