import { makeDirectoryWithin } from '@repo/scan-ingestion/fs/makeDirectoryWithin.util.ts';
import { writeTextFileWithin } from '@repo/scan-ingestion/fs/writeTextFileWithin.util.ts';
import { makeTempDirectory } from '@repo/scan-ingestion/testing/makeTempDirectory.util.ts';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildFileInventory } from './buildFileInventory.util.ts';

describe('buildFileInventory', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = makeTempDirectory('scan-ingestion-test-');
    makeDirectoryWithin({
      baseDirectory: rootPath,
      targetPath: path.join('src', 'utils'),
    });
    makeDirectoryWithin({
      baseDirectory: rootPath,
      targetPath: path.join('node_modules', 'ignored-pkg'),
    });
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: 'a\nb\nc\n',
      targetPath: path.join('src', 'App.component.tsx'),
    });
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: 'export const x = 1;\n',
      targetPath: path.join('src', 'utils', 'formatDate.util.ts'),
    });
    writeTextFileWithin({
      baseDirectory: rootPath,
      content: 'ignored',
      targetPath: path.join('node_modules', 'ignored-pkg', 'index.js'),
    });
  });

  afterEach(() => {
    rmSync(rootPath, { force: true, recursive: true });
  });

  it('collects files recursively with category/extension/nested_level', () => {
    const inventory = buildFileInventory({ rootPath });
    const paths = inventory
      .map((file) => file.file_path)
      .toSorted((left, right) => left.localeCompare(right));

    expect(paths).toEqual([
      'src/App.component.tsx',
      'src/utils/formatDate.util.ts',
    ]);
  });

  it('skips ignored directories like node_modules', () => {
    const inventory = buildFileInventory({ rootPath });

    expect(
      inventory.some((file) => file.file_path.includes('node_modules')),
    ).toBe(false);
  });

  it('computes nested_level as directory depth from root', () => {
    const inventory = buildFileInventory({ rootPath });
    const utilFile = inventory.find(
      (file) => file.file_path === 'src/utils/formatDate.util.ts',
    );

    expect(utilFile?.nested_level).toBe(2);
  });

  it('classifies category and extension correctly', () => {
    const inventory = buildFileInventory({ rootPath });
    const componentFile = inventory.find(
      (file) => file.file_path === 'src/App.component.tsx',
    );

    expect(componentFile?.file_type_category).toBe('component');
    expect(componentFile?.extension).toBe('.tsx');
    expect(componentFile?.line_count).toBe(4);
  });
});
