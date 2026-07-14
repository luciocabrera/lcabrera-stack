import path from 'node:path';

import type { RunFileInput } from './report.schema.ts';

import { listDirectoryWithin } from '../fs/listDirectoryWithin.util.ts';
import { readTextFileWithin } from '../fs/readTextFileWithin.util.ts';
import { classifyFileTypeCategory } from './classifyFileTypeCategory.util.ts';
import { IGNORED_DIRECTORIES } from './ignoredDirectories.constants.ts';

const getExtension = (fileName: string): string => {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex === -1 ? '' : fileName.slice(dotIndex);
};

type ReadLineCountArgs = {
  readonly fullPath: string;
  readonly rootPath: string;
};

const readLineCount = ({
  fullPath,
  rootPath,
}: ReadLineCountArgs): number | undefined => {
  try {
    return readTextFileWithin({
      baseDirectory: rootPath,
      targetPath: fullPath,
    }).split('\n').length;
  } catch {
    return undefined;
  }
};

type WalkArgs = {
  readonly currentPath: string;
  readonly results: RunFileInput[];
  readonly rootPath: string;
};

const walk = ({ currentPath, results, rootPath }: WalkArgs): void => {
  const entries = listDirectoryWithin({
    baseDirectory: rootPath,
    targetPath: currentPath,
  });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRECTORIES.has(entry.name)) continue;
      walk({
        currentPath: path.join(currentPath, entry.name),
        results,
        rootPath,
      });
      continue;
    }

    if (!entry.isFile()) continue;

    const fullPath = path.join(currentPath, entry.name);
    const filePath = path.relative(rootPath, fullPath);

    results.push({
      extension: getExtension(entry.name),
      file_path: filePath,
      file_type_category: classifyFileTypeCategory(entry.name),
      line_count: readLineCount({ fullPath, rootPath }),
      nested_level: filePath.split(path.sep).length - 1,
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
  walk({ currentPath: rootPath, results, rootPath });
  return results;
};
