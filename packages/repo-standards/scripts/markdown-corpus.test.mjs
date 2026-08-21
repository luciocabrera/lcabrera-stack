import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vite-plus/test';

import { documentedFiles, isIgnoredDoc } from './markdown-corpus.mjs';

/** A throwaway tree, since the walk is the half a pure test cannot reach. */
const treeWith = (files) => {
  const root = mkdtempSync(join(tmpdir(), 'corpus-'));
  for (const [path, contents] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, contents);
  }
  return root;
};

describe('isIgnoredDoc', () => {
  it('ignores what every repository generates, with no configuration', () => {
    for (const docPath of [
      'CHANGELOG.md',
      'node_modules/pkg/README.md',
      'docs/coordination/tasks/_TEMPLATE.md',
    ]) {
      expect(isIgnoredDoc({ docPath, ignoredDocs: [] })).toBe(true);
    }
  });

  it('keeps an ordinary document', () => {
    expect(isIgnoredDoc({ docPath: 'docs/README.md', ignoredDocs: [] })).toBe(
      false,
    );
  });

  it('honours a configured fragment', () => {
    expect(
      isIgnoredDoc({
        docPath: 'reports/lint/summary.md',
        ignoredDocs: ['reports/'],
      }),
    ).toBe(true);
  });

  it('treats a trailing slash as meaning the directory, not the word', () => {
    // The bug this guards. These fragments are substrings, so `reports/`
    // excludes a directory while `reports` excludes every document whose NAME
    // contains the word — which silently dropped
    // `ADR-049-findings-reports-are-produced-on-demand.md` out of the corpus.
    // A doc gate reading fewer files reports exactly the same clean pass as a
    // corpus with nothing wrong in it, so the slash is load-bearing and must
    // survive config parsing rather than being canonicalised away.
    const docPath = 'docs/decisions/ADR-049-findings-reports-are-produced.md';

    expect(isIgnoredDoc({ docPath, ignoredDocs: ['reports/'] })).toBe(false);
    expect(isIgnoredDoc({ docPath, ignoredDocs: ['reports'] })).toBe(true);
  });

  it('does not exempt dated records wholesale', () => {
    // Exempting `/decisions/` as a document hid every dead link in every ADR.
    // They are filtered per token by `enforcedTokens` instead: the paths an ADR
    // NAMES stay exempt as historical record, the links it asks you to FOLLOW
    // do not.
    expect(
      isIgnoredDoc({
        docPath: 'docs/decisions/ADR-044-x.md',
        ignoredDocs: [],
      }),
    ).toBe(false);
  });
});

describe('documentedFiles', () => {
  it('finds markdown at any depth and nothing else', () => {
    const root = treeWith({
      'README.md': '# root',
      'docs/guide/deep/NOTES.md': '# deep',
      'docs/not-markdown.txt': 'ignored',
      'src/index.ts': 'export const a = 1;',
    });

    expect(documentedFiles({ repoRoot: root }).toSorted()).toEqual([
      'README.md',
      'docs/guide/deep/NOTES.md',
    ]);
  });

  it('does not descend into build output or dependencies', () => {
    const root = treeWith({
      'KEEP.md': '# keep',
      'node_modules/pkg/README.md': '# dep',
      'dist/GENERATED.md': '# built',
      'coverage/REPORT.md': '# report',
    });

    expect(documentedFiles({ repoRoot: root })).toEqual(['KEEP.md']);
  });

  it('does not descend into a separate checkout', () => {
    // A linked worktree beside the repository is a second full copy. Walking
    // into it scans every document twice and resolves its relative references
    // against THIS root, so a doc that is correct in its own tree is reported
    // broken here — and because that path is gitignored, the gate failed only
    // on the machine that ran the recommended claim command and nowhere else.
    const root = treeWith({
      'KEEP.md': '# keep',
      'sibling-checkout/.git': 'gitdir: /elsewhere',
      'sibling-checkout/DOC.md': '# theirs',
    });

    expect(documentedFiles({ repoRoot: root })).toEqual(['KEEP.md']);
  });

  it('applies the configured exemptions to what it found', () => {
    const root = treeWith({
      'KEEP.md': '# keep',
      'vendor/THEIRS.md': '# vendored',
    });

    expect(
      documentedFiles({ ignoredDocs: ['vendor/'], repoRoot: root }),
    ).toEqual(['KEEP.md']);
  });
});
