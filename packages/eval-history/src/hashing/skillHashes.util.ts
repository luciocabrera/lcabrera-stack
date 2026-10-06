import type { HashedFile } from './hashing.types.ts';

import { catalogHash } from './catalogHash.util.ts';
import { compareCodeUnits } from './compareCodeUnits.util.ts';
import { fileSetHash } from './fileSetHash.util.ts';
import { SKILL_ENTRY_FILE } from './hashing.constants.ts';
import { skillCatalogEntry } from './skillCatalogEntry.util.ts';

export const skillHashes = (files: readonly HashedFile[]) => {
  const names = files
    .map(({ path }) => path.split('/'))
    .filter(
      (segments) => segments.length === 2 && segments[1] === SKILL_ENTRY_FILE,
    )
    .map(([name = '']) => name)
    .toSorted(compareCodeUnits);
  const skills = names.map((name) => {
    const prefix = `${name}/`;
    const own = files
      .filter(({ path }) => path.startsWith(prefix))
      .map(({ bytes, path }) => ({ bytes, path: path.slice(prefix.length) }));
    const entryFile = own.find(({ path }) => path === SKILL_ENTRY_FILE);

    return {
      content_hash: fileSetHash(own),
      entry: skillCatalogEntry(entryFile?.bytes ?? ''),
      name,
    };
  });

  return {
    catalog_hash: catalogHash(skills.map(({ entry }) => entry)),
    skills: skills.map(({ content_hash, name }) => ({ content_hash, name })),
  };
};
