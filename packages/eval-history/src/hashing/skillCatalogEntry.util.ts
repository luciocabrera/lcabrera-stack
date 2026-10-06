import { parse } from 'yaml';

import type { SkillCatalogEntry } from './hashing.types.ts';

import { isPlainObject } from './isPlainObject.util.ts';
import { normalizeText } from './normalizeText.util.ts';

const FRONTMATTER = /^---\n([\s\S]*?)\n---(?:\n|$)/u;

export const skillCatalogEntry = (source: string | Uint8Array) => {
  const frontmatter: unknown = parse(
    FRONTMATTER.exec(normalizeText(source))?.[1] ?? '',
  );
  const { description, name, paths } = isPlainObject(frontmatter)
    ? frontmatter
    : {};
  const isPathList =
    Array.isArray(paths) &&
    paths.every((item): item is string => typeof item === 'string');

  return {
    ...(typeof description === 'string' && { description }),
    ...(typeof name === 'string' && { name }),
    ...(isPathList && { paths }),
  } satisfies SkillCatalogEntry;
};
