/**
 * The rules worth a test are the ones a record can break silently: a block that
 * is absent, one whose key is misspelled, a section heading with nothing under
 * it, and the two alternatives sections whose rule is "at least one". Each case
 * below asserts the finding as well as the failure, because a gate that fails
 * for the wrong reason is a gate nobody can act on.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  ALTERNATIVE_SECTIONS,
  REPOSITORY_SCOPE,
  adrBody,
  blockFindings,
  governedBy,
  parseAdrBlock,
  recordFindings,
  sectionFindings,
  sectionsOf,
} from './adr-content.mjs';

const WORKSPACES = new Set(['server', 'ui']);

const block = (governs) => `---\ngoverns:\n${governs}---\n`;

const BODY = `
# ADR-001 — A decision

## Context

What was true before.

## Decision

What is true now.

## Consequences

What it costs.

## Alternatives considered

The one that lost.
`;

const record = (governs) => `${block(governs)}${BODY}`;

const findings = (markdown) =>
  recordFindings({ markdown, workspaces: WORKSPACES });

describe('adrBody', () => {
  it('takes the block off the front', () => {
    expect(adrBody(record('  - ui\n'))).toBe(BODY);
  });

  it('leaves a record that carries no block alone', () => {
    expect(adrBody('# ADR-001 — x\n')).toBe('# ADR-001 — x\n');
  });

  it('hides a comment inside the block from anything reading the heading', () => {
    // The heading number check reads the body. Were it to read the file, a `#`
    // comment here would be picked up as the H1 and the check would stop firing
    // while still reporting a clean pass.
    const withComment = `---\n# not a heading\ngoverns:\n  - ui\n---\n\n# ADR-001 — x\n`;
    expect(adrBody(withComment).trim()).toBe('# ADR-001 — x');
  });
});

describe('parseAdrBlock', () => {
  it('reads block lists and flow lists the same way', () => {
    expect(parseAdrBlock('---\ngoverns: [ui, server]\n---\n').fields).toEqual({
      governs: ['ui', 'server'],
    });
    expect(
      parseAdrBlock('---\ngoverns:\n  - ui\n  - server\n---\n').fields,
    ).toEqual({ governs: ['ui', 'server'] });
  });

  it('reports a key declared twice rather than keeping the last', () => {
    // The parser the doc registers share is silently last-wins. A gate whose job
    // is to read the record must not lose half of what it was handed.
    const parsed = parseAdrBlock(
      '---\ngoverns: [ui]\ngoverns: [server]\n---\n',
    );
    expect(parsed.errors).toEqual([
      expect.stringContaining('`governs` is declared twice'),
    ]);
    expect(parsed.fields.governs).toEqual(['ui']);
  });

  it('reports a line it cannot read instead of skipping it', () => {
    expect(parseAdrBlock('---\ngoverns: [ui]\nnonsense\n---\n').errors).toEqual(
      [expect.stringContaining('cannot read')],
    );
  });

  it('returns undefined when the record opens no block', () => {
    expect(parseAdrBlock('# ADR-001 — x\n')).toBeUndefined();
  });
});

describe('blockFindings', () => {
  it('accepts a workspace and the repository scope, and nothing else', () => {
    expect(findings(record('  - ui\n'))).toEqual([]);
    expect(findings(record(`  - ${REPOSITORY_SCOPE}\n`))).toEqual([]);
    expect(findings(record('  - nope\n'))).toEqual([
      expect.stringContaining('no workspace in this repository'),
    ]);
  });

  it('refuses the two scopes mixed, because one denies the other', () => {
    expect(findings(record(`  - ui\n  - ${REPOSITORY_SCOPE}\n`))).toEqual([
      expect.stringContaining('is one or the other'),
    ]);
  });

  it('refuses an empty list rather than reading it as repository-wide', () => {
    // Otherwise "governs everything" and "nobody filled this in" are spelled
    // the same, and the second is the one that happens by accident.
    expect(findings(`---\ngoverns: []\n---\n${BODY}`)).toEqual([
      expect.stringContaining(REPOSITORY_SCOPE),
    ]);
  });

  it('names a misspelled key instead of reporting the block as empty', () => {
    expect(findings(`---\npackages:\n  - ui\n---\n${BODY}`)).toEqual([
      expect.stringContaining('`packages` is not a key of the block'),
      expect.stringContaining('no `governs`'),
    ]);
  });

  it('says the roster could not be derived when there is none', () => {
    expect(
      blockFindings({ markdown: record('  - ui\n'), workspaces: new Set() }),
    ).toEqual([
      expect.stringContaining('no workspace roster could be derived'),
    ]);
  });

  it('reports the missing block as its own finding', () => {
    expect(blockFindings({ markdown: BODY, workspaces: WORKSPACES })).toEqual([
      expect.stringContaining('no metadata block'),
    ]);
  });
});

describe('sectionFindings', () => {
  it('passes a record that has all three plus one alternatives section', () => {
    expect(sectionFindings(BODY)).toEqual([]);
  });

  it.each(['Context', 'Decision', 'Consequences'])(
    'fails a record with no %s',
    (heading) => {
      const without = BODY.replace(`## ${heading}`, '## Something else');
      expect(sectionFindings(without)).toContain(
        `no \`## ${heading}\` section`,
      );
    },
  );

  it('fails a heading with nothing under it', () => {
    const empty = BODY.replace('What is true now.', '');
    expect(sectionFindings(empty)).toContain('`## Decision` is empty');
  });

  it('reads the template prompts as nothing, not as content', () => {
    // A scaffolded record whose prompts are all still in place has said nothing,
    // and must not pass for having a heading over each comment.
    const prompted = BODY.replace(
      'What is true now.',
      '<!-- what is now true -->',
    );
    expect(sectionFindings(prompted)).toContain('`## Decision` is empty');
  });

  it.each(ALTERNATIVE_SECTIONS)('accepts %s on its own', (heading) => {
    const only = BODY.replace('## Alternatives considered', `## ${heading}`);
    expect(sectionFindings(only)).toEqual([]);
  });

  it('fails a record carrying neither of the two', () => {
    const neither = BODY.replace('## Alternatives considered', '## References');
    expect(sectionFindings(neither)).toEqual([
      expect.stringContaining('neither'),
    ]);
  });

  it('keeps a `###` subsection inside the section it sits in', () => {
    expect(
      sectionsOf('## Decision\n\n### Detail\n\ntext\n').get('decision'),
    ).toContain('### Detail');
  });
});

describe('governedBy', () => {
  it('answers with the declared list, and with none when there is no block', () => {
    expect(governedBy(record('  - ui\n'))).toEqual(['ui']);
    expect(governedBy(BODY)).toEqual([]);
  });
});
