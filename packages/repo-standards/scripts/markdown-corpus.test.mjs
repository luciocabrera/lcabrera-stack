import { describe, expect, it } from 'vite-plus/test';

import { isIgnoredDoc } from './markdown-corpus.mjs';

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
