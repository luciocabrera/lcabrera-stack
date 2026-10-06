import type { HashedFile } from '../hashing/hashing.types.ts';

import { contentHash } from '../hashing/contentHash.util.ts';
import { MIGRATION_FILE_PATTERN } from './migrate.constants.ts';

export const toMigration = ({ bytes, path }: HashedFile) => {
  const version = MIGRATION_FILE_PATTERN.exec(path)?.[1];

  if (!version) {
    throw new Error(
      `Migration file "${path}" is not named NNNN-<kebab-slug>.sql`,
    );
  }

  return {
    name: path,
    sha256: contentHash(bytes),
    sql: typeof bytes === 'string' ? bytes : new TextDecoder().decode(bytes),
    version: Number(version),
  };
};
