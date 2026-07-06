import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import type { RunFileInput } from './report.schema.ts';

import { classifyFileTypeCategory } from './classifyFileTypeCategory.util.ts';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.react-router',
  '.tmp',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

const getExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex);
};

const readLineCount = (filePath: string): number | undefined => {
  try {
    return readFileSync(filePath, 'utf8').split('\n').length;
  } catch {
    return undefined;
  }
};

const walk = (
  currentPath: string,
  rootPath: string,
  results: RunFileInput[],
): void => {
  for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      walk(join(currentPath, entry.name), rootPath, results);
      continue;
    }

    if (!entry.isFile()) continue;

    const fullPath = join(currentPath, entry.name);
    const filePath = relative(rootPath, fullPath);

    results.push({
      extension: getExtension(entry.name),
      file_path: filePath,
      file_type_category: classifyFileTypeCategory(entry.name),
      line_count: readLineCount(fullPath),
      nested_level: filePath.split(sep).length - 1,
    });
  }
};

type BuildFileInventoryArgs = {
  readonly rootPath: string;
};

/**
 * Only meaningful for whole-project scopes (repo/folder) — diff-scoped
 * scans (code-smell-zen) pass no file inventory to ingestReport at all.
 */
export const buildFileInventory = ({
  rootPath,
}: BuildFileInventoryArgs): readonly RunFileInput[] => {
  const results: RunFileInput[] = [];
  walk(rootPath, rootPath, results);
  return results;
};
