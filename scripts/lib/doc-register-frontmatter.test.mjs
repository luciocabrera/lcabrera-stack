import { describe, expect, it } from 'vite-plus/test';

import { bodyOf, parseFrontmatter } from './doc-register-frontmatter.mjs';

// The four shapes the two registers actually use. A parser that silently drops
// one reports the field as absent, and an absent-field message sends the reader
// to look for a line that is right there — so each shape is asserted rather
// than assumed from the register happening to pass.

const REQUIREMENT = `---
id: render-a-table
lines:
  - application
persona: application-developer
state: unmet
packages: [ui, server]
requires: []
issues:
  - 994
evidence:
  - type: code
    ref: packages/ui/src/public-api.ts
  - type: command
    ref: vp run test:ci
---

# A title

## Statement
`;

describe('parseFrontmatter', () => {
  it('reads scalars, block lists, flow lists and a list of maps', () => {
    const { errors, fields } = parseFrontmatter(REQUIREMENT);

    expect(errors).toEqual([]);
    expect(fields.id).toBe('render-a-table');
    expect(fields.lines).toEqual(['application']);
    expect(fields.packages).toEqual(['ui', 'server']);
    expect(fields.requires).toEqual([]);
    expect(fields.issues).toEqual(['994']);
    expect(fields.evidence).toEqual([
      { ref: 'packages/ui/src/public-api.ts', type: 'code' },
      { ref: 'vp run test:ci', type: 'command' },
    ]);
  });

  it('keeps the colons inside a value', () => {
    const { fields } = parseFrontmatter(
      '---\nevidence:\n  - type: command\n    ref: vp run docs:verify\n---\n',
    );

    expect(fields.evidence).toEqual([
      { ref: 'vp run docs:verify', type: 'command' },
    ]);
  });

  it("strips the quotes a planning block's issues carry", () => {
    const { fields } = parseFrontmatter(
      "---\nissues: ['#389', '#390']\npackages: [server, showcase]\n---\n",
    );

    expect(fields.issues).toEqual(['#389', '#390']);
    expect(fields.packages).toEqual(['server', 'showcase']);
  });

  it('reads an empty block list and an empty flow list alike', () => {
    const blockForm = parseFrontmatter('---\nrequires:\nissues: []\n---\n');

    expect(blockForm.fields.requires).toEqual([]);
    expect(blockForm.fields.issues).toEqual([]);
  });

  // A document with no block is not a malformed one — it is a different case,
  // and the drafts exclusion depends on the caller being able to tell them
  // apart.
  it('returns undefined when the document opens with no block', () => {
    expect(parseFrontmatter('# Just a heading\n')).toBeUndefined();
    expect(parseFrontmatter('---\nid: unterminated\n')).toBeUndefined();
  });

  it('reports a malformed line rather than dropping it', () => {
    const { errors } = parseFrontmatter('---\nid: fine\nnot a pair\n---\n');

    expect(errors).toEqual(['line 3: cannot read `not a pair`']);
  });

  it('reports an unterminated flow list', () => {
    const { errors } = parseFrontmatter('---\npackages: [ui, server\n---\n');

    expect(errors).toEqual(['line 2: unterminated flow list']);
  });
});

describe('bodyOf', () => {
  it('returns everything after the block', () => {
    expect(bodyOf(REQUIREMENT)).toBe('\n# A title\n\n## Statement\n');
  });

  it('treats a document with no block as all body', () => {
    expect(bodyOf('# Draft\n')).toBe('# Draft\n');
  });
});
