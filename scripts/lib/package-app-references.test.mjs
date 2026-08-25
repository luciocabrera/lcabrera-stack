import { describe, expect, it } from 'vite-plus/test';

import {
  appReferences,
  formatFinding,
  isCheckedFile,
} from './package-app-references.mjs';

const inRepo = new Set(['apps/react-router', 'apps/docs-site']);
const find = (text) =>
  appReferences({ exists: (path) => inRepo.has(path), path: 'doc.md', text });

describe('appReferences', () => {
  it('flags an app that exists in this repository', () => {
    expect(find('see apps/react-router/src')).toEqual([
      { line: 1, path: 'doc.md', reference: 'apps/react-router' },
    ]);
  });

  it('ignores an app path that does not exist here', () => {
    // The whole point: `apps/web` in a config example is generic illustration.
    expect(find('a consumer might have apps/web/**')).toEqual([]);
  });

  it('matches an app name containing an underscore', () => {
    // A class excluding `_` matches only the prefix, which then fails the
    // existence test — a silent pass on exactly what the gate is for. The
    // name is synthetic so the case keeps its underscore whatever this repo's
    // apps are called.
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
    // Each mention is its own edit, so collapsing them would hide work behind
    // a gate that has to be re-run to reveal it.
    const findings = find(
      'apps/docs-site\n\napps/react-router\napps/docs-site again',
    );
    expect(findings.map((finding) => finding.reference)).toEqual([
      'apps/docs-site',
      'apps/react-router',
      'apps/docs-site',
    ]);
    expect(findings.map((finding) => finding.line)).toEqual([1, 3, 4]);
  });
});

describe('isCheckedFile', () => {
  it('checks every text form a package ships, not just markdown', () => {
    // A comment in shipped `src` reaches a consumer the same way prose does.
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
    // devkit ships workflow templates and two extensionless git hooks; a
    // `paths:` filter naming an app is exactly what this gate is for.
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
    // Skipping it would ship an unchecked file — the exclusions are the
    // authority, not the suffix convention.
    expect(isCheckedFile('packages/ui/src/Table.spec.ts')).toBe(true);
  });
});

describe('fenced code', () => {
  it('does not flag a worked example inside a fence', () => {
    // `apps/web` is illustration in several shipped READMEs; it must keep
    // passing on the day this repo gains an app by that name.
    expect(find('intro\n```ts\napps/react-router\n```\n')).toEqual([]);
  });

  it('flags prose again after the fence closes', () => {
    const findings = find(
      '```ts\napps/docs-site\n```\nthen apps/react-router\n',
    );
    expect(findings).toEqual([
      { line: 4, path: 'doc.md', reference: 'apps/react-router' },
    ]);
  });

  it('does not treat backticks in source as a fence', () => {
    const findings = appReferences({
      exists: (path) => inRepo.has(path),
      path: 'pkg/src/x.ts',
      text: '// ```\n// apps/react-router\n',
    });
    expect(findings.map((finding) => finding.line)).toEqual([2]);
  });
});

describe('formatFinding', () => {
  it('names the file, the line and the reference', () => {
    const message = formatFinding({
      line: 12,
      path: 'packages/ui/README.md',
      reference: 'apps/react-router',
    });
    expect(message).toContain('packages/ui/README.md:12');
    expect(message).toContain('apps/react-router');
  });
});
