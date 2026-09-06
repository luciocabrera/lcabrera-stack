/**
 * The route-artifact gate and the `domain-folder-filename` ESLint rule parse a
 * filename the same way, and exempt the same folders.
 *
 * Two implementations of one convention, in two packages that do not depend on
 * each other — so the statement is about this repository holding them in step,
 * and it belongs here rather than in either package. Asserting it from inside
 * `@lcabrera/repo-standards` needed a relative import into
 * `packages/eslint-local-rules/src`, an edge nothing declares and that
 * `@lcabrera/eslint-plugin` does not expose on its `exports` map: it resolves
 * only because both happen to sit in this workspace, which is the undeclared
 * edge ADR-039 holds the public packages against. From root `scripts/` it
 * crosses no package boundary at all.
 *
 * The rule's defaults are read out of its source rather than imported, because
 * they are `const` arrays inside the rule module rather than exports.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { parseFileName as parseInRule } from '../../packages/eslint-local-rules/src/file-names.ts';
import {
  ARTIFACT_TREE_FOLDERS,
  CATCH_ALL_FOLDERS,
  PAIRED_SUFFIXES,
  parseFileName,
} from '../../packages/repo-standards/scripts/route-artifacts.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RULE_SOURCE = join(
  REPO_ROOT,
  'packages/eslint-local-rules/src/domain-folder-filename.ts',
);

const defaultListInRule = (name) => {
  const source = readFileSync(RULE_SOURCE, 'utf8');
  const declaration = source.indexOf(`const ${name} = [`);
  const open = source.indexOf('[', declaration);
  const close = source.indexOf(']', open);
  const body = source
    .slice(open + 1, close)
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
  return body.split("'").filter((_, index) => index % 2 === 1);
};

describe('agreement with local-rules/domain-folder-filename', () => {
  it('parses a filename exactly as the rule does', () => {
    const cases = [
      'apps/a/src/routes/car-sales/CarSales.types.ts',
      'apps/a/src/routes/reports/Reports.constants.tsx',
      'apps/a/src/routes/reports/trigger-scan/triggerScan.constants.ts',
      'apps/a/src/routes/x/editOrder.action.test.ts',
      'apps/a/src/routes/x/Root.error-boundary.tsx',
      'apps/a/src/routes/x/index.ts',
      'README.md',
    ];
    for (const filePath of cases) {
      expect(parseFileName(filePath)).toEqual(parseInRule(filePath));
    }
  });

  it('exempts the same folder kinds the rule calls catch-all', () => {
    expect(CATCH_ALL_FOLDERS).toEqual(
      defaultListInRule('DEFAULT_CATCH_ALL_FOLDERS'),
    );
  });

  it('walks the same trees the rule exempts', () => {
    expect(ARTIFACT_TREE_FOLDERS).toEqual(
      defaultListInRule('DEFAULT_ARTIFACT_FOLDERS'),
    );
  });

  it('checks the same file suffixes the rule pairs', () => {
    expect(PAIRED_SUFFIXES).toEqual(
      defaultListInRule('DEFAULT_PAIRED_SUFFIXES'),
    );
  });
});
