import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { buildFileInventory } from './buildFileInventory.util.ts';

describe('buildFileInventory', () => {
  let rootPath: string;

  beforeEach(() => {
    rootPath = mkdtempSync(join(tmpdir(), 'scan-ingestion-test-'));
    mkdirSync(join(rootPath, 'src', 'utils'), { recursive: true });
    mkdirSync(join(rootPath, 'node_modules', 'ignored-pkg'), {
      recursive: true,
    });
    writeFileSync(join(rootPath, 'src', 'App.component.tsx'), 'a\nb\nc\n');
    writeFileSync(
      join(rootPath, 'src', 'utils', 'formatDate.util.ts'),
      'export const x = 1;\n',
    );
    writeFileSync(
      join(rootPath, 'node_modules', 'ignored-pkg', 'index.js'),
      'ignored',
    );
  });

  afterEach(() => {
    rmSync(rootPath, { force: true, recursive: true });
  });

  it('collects files recursively with category/extension/nested_level', () => {
    const inventory = buildFileInventory({ rootPath });
    const paths = inventory.map((file) => file.file_path).toSorted();

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
