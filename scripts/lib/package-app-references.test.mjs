import { describe, expect, it } from 'vite-plus/test';

import {
  appReferences,
  formatFinding,
  isCheckedDocument,
} from './package-app-references.mjs';

const inRepo = new Set(['apps/react-router', 'apps/admin']);
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

  it('ignores prose about the apps directory', () => {
    expect(find('the apps/ directory holds the harness')).toEqual([]);
  });

  it('reports every occurrence, not just the first per name', () => {
    // Each mention is its own edit, so collapsing them would hide work behind
    // a gate that has to be re-run to reveal it.
    const findings = find('apps/admin\n\napps/react-router\napps/admin again');
    expect(findings.map((finding) => finding.reference)).toEqual([
      'apps/admin',
      'apps/react-router',
      'apps/admin',
    ]);
    expect(findings.map((finding) => finding.line)).toEqual([1, 3, 4]);
  });
});

describe('isCheckedDocument', () => {
  it('checks markdown but not a generated changelog', () => {
    expect(isCheckedDocument('packages/ui/README.md')).toBe(true);
    expect(isCheckedDocument('packages/ui/CHANGELOG.md')).toBe(false);
    expect(isCheckedDocument('packages/ui/src/index.ts')).toBe(false);
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
