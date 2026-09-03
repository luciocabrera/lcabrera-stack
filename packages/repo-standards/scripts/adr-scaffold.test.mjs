/**
 * `scaffoldSummary`, and only that. It is the one function in `adr-scaffold.mjs`
 * with no coverage anywhere else.
 *
 * The rest of the module is exercised by `scripts/lib/adr-scaffold.test.mjs`,
 * which renders this repository's real `docs/decisions/_TEMPLATE.md` and so
 * fails when the shipped template drifts from what `renderAdr` expects. That
 * suite stays at the root deliberately: it asserts a fact about the host
 * repository's documents, which a published package's own tests have no
 * business depending on.
 *
 * Nothing here pins what the dry run prints. `scaffoldSummary` is never handed a
 * template, so no test at this level can tell a dry run that prints the record
 * from one that does not — `new-adr.test.mjs` runs the bin for that, and is the
 * file to read for issue #1056.
 */
import { describe, expect, it } from 'vite-plus/test';

import { scaffoldSummary } from './adr-scaffold.mjs';

describe('scaffoldSummary', () => {
  it('names the path, the padded number and the title', () => {
    expect(
      scaffoldSummary({
        number: 7,
        path: 'docs/decisions/ADR-007-a-slug.md',
        title: 'A decision',
      }),
    ).toBe(
      'would write docs/decisions/ADR-007-a-slug.md as ADR-007 — A decision',
    );
  });

  it('renders one line for a title given on one line', () => {
    expect(
      scaffoldSummary({
        number: 107,
        path: 'docs/decisions/ADR-107-a-slug.md',
        title: 'A decision',
      }),
    ).not.toContain('\n');
  });
});
