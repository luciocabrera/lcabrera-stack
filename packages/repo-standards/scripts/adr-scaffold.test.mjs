/**
 * The scaffold's pure functions over strings: what each renders, and what
 * `renderAdr` refuses.
 *
 * These do not pin the dry run's output. `scaffoldSummary` is never handed a
 * template, so no test here can tell a dry run that prints the record from one
 * that does not — `new-adr.test.mjs` runs the bin for that, and is the file to
 * read for issue #1056.
 *
 * `renderAdr`'s throw earns a test of its own: it is what refuses a template
 * that has lost its heading, and the dry run still calls it, so a scaffold that
 * would fail on the write fails on the preview too.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  adrFilename,
  pad,
  renderAdr,
  resolveHome,
  scaffoldSummary,
  slugify,
} from './adr-scaffold.mjs';

const TEMPLATE = [
  '---',
  'governs:',
  '  - <repository, or one workspace directory name per line>',
  '---',
  '',
  '<!--',
  '  Instructions the scaffolded record does not keep.',
  '-->',
  '',
  '# ADR-NNN — <one line, in the imperative: what was decided>',
  '',
  '## Context',
  '',
].join('\n');

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
    const summary = scaffoldSummary({
      number: 107,
      path: 'docs/decisions/ADR-107-a-slug.md',
      title: 'A decision',
    });

    expect(summary).not.toContain('\n');
  });
});

describe('renderAdr', () => {
  it('fills in the heading and drops the instruction comment', () => {
    const record = renderAdr({
      number: 107,
      template: TEMPLATE,
      title: 'Say what the dry run may print',
    });

    expect(record).toContain('# ADR-107 — Say what the dry run may print');
    expect(record).not.toContain('Instructions the scaffolded record does not');
    expect(record).not.toContain('ADR-NNN');
  });

  it('carries the governs block through unchanged', () => {
    const record = renderAdr({
      number: 107,
      template: TEMPLATE,
      title: 'A decision',
    });

    expect(record.startsWith('---\ngoverns:')).toBe(true);
  });

  it('refuses a template that has lost its heading', () => {
    expect(() =>
      renderAdr({
        number: 107,
        template: TEMPLATE.replace('# ADR-NNN — ', '# '),
        title: 'A decision',
      }),
    ).toThrow('no longer has an `# ADR-NNN — …` heading');
  });
});

describe('slugify and adrFilename', () => {
  it('reduces a title to ASCII words joined by single hyphens', () => {
    expect(slugify('Say what the DRY RUN may print!')).toBe(
      'say-what-the-dry-run-may-print',
    );
  });

  it('gives an empty slug when nothing ASCII survives', () => {
    expect(slugify('—— ¿?')).toBe('');
  });

  it('pads the number to three digits and slugs the title', () => {
    expect(adrFilename(7, 'A Decision')).toBe('ADR-007-a-decision.md');
    expect(pad(1007)).toBe('1007');
  });
});

describe('resolveHome', () => {
  const homes = [
    { dir: 'docs/decisions', tier: 'repo' },
    { dir: 'apps/showcase/docs', tier: 'app' },
  ];

  it('finds the home a tier names', () => {
    expect(resolveHome(homes, 'app')?.dir).toBe('apps/showcase/docs');
  });

  it('returns undefined for a tier no home declares', () => {
    expect(resolveHome(homes, 'package')).toBeUndefined();
  });
});
