import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import {
  ADR_HOMES,
  TEMPLATE_FILE,
  TEMPLATE_HOME,
  parseAdrFilename,
} from './adr-registry.mjs';
import {
  adrFilename,
  pad,
  renderAdr,
  resolveHome,
  slugify,
} from './adr-scaffold.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const template = () =>
  readFileSync(join(REPO_ROOT, TEMPLATE_HOME, TEMPLATE_FILE), 'utf8');

describe('slugify', () => {
  it.each([
    [
      'Findings reports are produced on demand',
      'findings-reports-are-produced-on-demand',
    ],
    [
      '`withTransaction` + an optional `tx` option',
      'withtransaction-an-optional-tx-option',
    ],
    [
      'One ADR home per tier — one sequence',
      'one-adr-home-per-tier-one-sequence',
    ],
  ])('slugs %j', (title, expected) => {
    expect(slugify(title)).toBe(expected);
  });

  it('returns empty for a title with no ASCII words, so the CLI can ask for --slug', () => {
    expect(slugify('— — —')).toBe('');
  });
});

describe('adrFilename', () => {
  it('produces a name the ADR gate accepts', () => {
    // The point of the scaffold: what it writes must pass the check that would
    // otherwise reject it. Parsed with the gate's own parser, not a copy.
    const filename = adrFilename(52, 'Some new decision');
    expect(filename).toBe('ADR-052-some-new-decision.md');
    expect(parseAdrFilename(filename)).toEqual({
      number: 52,
      slug: 'some-new-decision',
    });
  });

  it('pads below 100 and leaves three digits alone', () => {
    expect(pad(7)).toBe('007');
    expect(pad(142)).toBe('142');
  });
});

describe('renderAdr', () => {
  const rendered = () =>
    renderAdr({ number: 52, template: template(), title: 'A new decision' });

  it('fills in the heading with the number and title', () => {
    expect(rendered()).toMatch(/^# ADR-052 — A new decision$/m);
  });

  it('agrees with the filename the same call would produce', () => {
    // A heading number that disagrees with its filename is one of the two
    // findings `adr:verify` reports; the scaffold must not be able to create it.
    const filename = adrFilename(52, 'A new decision');
    expect(parseAdrFilename(filename).number).toBe(52);
    expect(rendered()).toContain(`# ADR-${pad(52)} `);
  });

  it("drops the template's own instructions", () => {
    expect(template()).toMatch(/^\s*<!--/);
    expect(rendered()).toMatch(/^# ADR-052/);
    expect(rendered()).not.toContain('vp run adr:new');
  });

  it('keeps the per-section prompts, which are what tell the author what goes there', () => {
    expect(rendered()).toContain('## Context');
    expect(rendered()).toContain('## Decision');
    expect(rendered()).toContain('## Consequences');
  });

  it('fails loudly if the template loses its heading', () => {
    expect(() =>
      renderAdr({ number: 52, template: '## Context\n', title: 'x' }),
    ).toThrow(/heading/);
  });
});

describe('resolveHome', () => {
  it.each(ADR_HOMES.map((home) => home.tier))(
    'resolves the %s tier',
    (tier) => {
      expect(resolveHome(ADR_HOMES, tier)?.tier).toBe(tier);
    },
  );

  it('returns undefined for an unknown tier, so the CLI can list the real ones', () => {
    expect(resolveHome(ADR_HOMES, 'nope')).toBeUndefined();
  });
});

describe('the shipped template', () => {
  it('carries the sections every recent ADR uses', () => {
    // Derived from ADR-047..051 rather than invented — see the template header.
    for (const heading of [
      '## Context',
      '## Decision',
      '## Consequences',
      '## Alternatives considered',
    ]) {
      expect(template()).toContain(heading);
    }
  });

  it('is not itself readable as an ADR', () => {
    // It lives inside a home; if the gate read it as an entry it would report a
    // malformed filename on every run.
    expect(parseAdrFilename(TEMPLATE_FILE)).toBeUndefined();
  });
});
