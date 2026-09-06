import { describe, expect, it } from 'vite-plus/test';

import {
  appReferences,
  formatFinding,
  isCheckedFile,
} from './package-app-references.mjs';

const inRepo = new Set(['apps/showcase', 'apps/docs-site']);
const find = (text) =>
  appReferences({ exists: (path) => inRepo.has(path), path: 'doc.md', text });

describe('appReferences', () => {
  it('flags an app that exists in this repository', () => {
    expect(find('see apps/showcase/src')).toEqual([
      { line: 1, path: 'doc.md', reference: 'apps/showcase' },
    ]);
  });

  it('ignores an app path that does not exist here', () => {
    expect(find('a consumer might have apps/web/**')).toEqual([]);
  });

  it('matches an app name containing an underscore', () => {
    expect(
      appReferences({
        exists: (path) => path === 'apps/docs_site',
        path: 'doc.md',
        text: 'see apps/docs_site/src/x.ts',
      }),
    ).toEqual([{ line: 1, path: 'doc.md', reference: 'apps/docs_site' }]);
  });

  it('ignores prose about the apps directory', () => {
    expect(find('the apps/ directory holds the harness')).toEqual([]);
  });

  it('reports every occurrence, not just the first per name', () => {
    const findings = find(
      'apps/docs-site\n\napps/showcase\napps/docs-site again',
    );
    expect(findings.map((finding) => finding.reference)).toEqual([
      'apps/docs-site',
      'apps/showcase',
      'apps/docs-site',
    ]);
    expect(findings.map((finding) => finding.line)).toEqual([1, 3, 4]);
  });
});

describe('isCheckedFile', () => {
  it('checks every text form a package ships, not just markdown', () => {
    for (const shipped of [
      'packages/ui/README.md',
      'packages/ui/src/design-system/reset.css',
      'packages/ui/src/index.ts',
      'packages/ui/src/Table.tsx',
      'packages/repo-standards/scripts/adr-registry.mjs',
    ]) {
      expect(isCheckedFile(shipped)).toBe(true);
    }
  });

  it('skips the generated changelog and non-text files', () => {
    expect(isCheckedFile('packages/ui/CHANGELOG.md')).toBe(false);
    expect(isCheckedFile('packages/ui/src/logo.png')).toBe(false);
    expect(isCheckedFile('packages/ui/package.json')).toBe(false);
  });

  it('checks the non-source text a package ships', () => {
    expect(isCheckedFile('packages/devkit/assets/workflows/check.yml')).toBe(
      true,
    );
    expect(isCheckedFile('packages/devkit/assets/hooks/pre-push')).toBe(true);
    expect(isCheckedFile('packages/ui/assets/font.woff2')).toBe(false);
  });

  it('skips .test.*, which every package excludes from its files', () => {
    expect(isCheckedFile('packages/ui/src/Table.test.tsx')).toBe(false);
    expect(isCheckedFile('packages/repo-standards/scripts/x.test.mjs')).toBe(
      false,
    );
    expect(isCheckedFile('packages/ui/src/Table.tsx')).toBe(true);
  });

  it('checks .spec.*, which no manifest excludes', () => {
    expect(isCheckedFile('packages/ui/src/Table.spec.ts')).toBe(true);
  });
});

describe('fenced code', () => {
  it('does not flag a worked example inside a fence', () => {
    expect(find('intro\n```ts\napps/showcase\n```\n')).toEqual([]);
  });

  it('flags prose again after the fence closes', () => {
    const findings = find('```ts\napps/docs-site\n```\nthen apps/showcase\n');
    expect(findings).toEqual([
      { line: 4, path: 'doc.md', reference: 'apps/showcase' },
    ]);
  });

  it('does not treat backticks in source as a fence', () => {
    const findings = appReferences({
      exists: (path) => inRepo.has(path),
      path: 'pkg/src/x.ts',
      text: '// ```\n// apps/showcase\n',
    });
    expect(findings.map((finding) => finding.line)).toEqual([2]);
  });
});

describe('formatFinding', () => {
  it('names the file, the line and the reference', () => {
    const message = formatFinding({
      line: 12,
      path: 'packages/ui/README.md',
      reference: 'apps/showcase',
    });
    expect(message).toContain('packages/ui/README.md:12');
    expect(message).toContain('apps/showcase');
  });
});
