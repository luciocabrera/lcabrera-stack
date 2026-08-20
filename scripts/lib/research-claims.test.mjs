import { describe, expect, it } from 'vite-plus/test';

import {
  isAnswered,
  paragraphsOf,
  unprobedClaims,
} from './research-claims.mjs';

const doc = (body) => unprobedClaims('docs/agents/research/x.md', body);

describe('unprobedClaims', () => {
  it('reports a count with neither a command nor an enumeration', () => {
    const found = doc('The repo ships 17 sibling plugins.');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      count: 17,
      line: 1,
      phrase: '17 sibling plugins',
    });
  });

  it('accepts a count whose paragraph names the command that produces it', () => {
    expect(doc('It ships 17 sibling plugins (`ls -d */ | wc -l`).')).toEqual(
      [],
    );
  });

  it('accepts a count whose paragraph enumerates what it counts', () => {
    expect(doc('Four templates: `a.md`, `b.md`, `c.md`, `d.md`.')).toEqual([]);
  });

  it('reports an enumeration that is shorter than the count claims', () => {
    expect(doc('Nine templates: `a.md`, `b.md`.')).toHaveLength(1);
  });

  it('reads number-words as well as digits', () => {
    expect(doc('The router bundles sixteen playbooks.')).toHaveLength(1);
  });

  // The floor is what keeps the gate from arguing with prose. Without it,
  // "two packages" and "three commits" are reported on every narrative page.
  it('ignores small number-words used narratively', () => {
    expect(
      doc('The design splits into two packages across three commits.'),
    ).toEqual([]);
  });

  // Digits that identify a thing rather than count one.
  it('ignores identifiers that merely contain digits', () => {
    expect(doc('ADR-081 and #833 both name skills.')).toEqual([]);
  });

  it('ignores a number attached to a noun that is not a countable artifact', () => {
    expect(doc('It took 12 minutes and 40 seconds.')).toEqual([]);
  });

  it('locates a finding on the line its paragraph starts', () => {
    expect(
      doc('intro\n\nsecond para\n\nIt ships 17 sibling plugins.')[0].line,
    ).toBe(5);
  });
});

describe('paragraphsOf', () => {
  it('joins wrapped lines and splits on blank lines', () => {
    expect(paragraphsOf('a\nb\n\nc')).toEqual([
      { line: 1, text: 'a\nb' },
      { line: 4, text: 'c' },
    ]);
  });
});

describe('isAnswered', () => {
  it('counts backticked items across the whole paragraph', () => {
    expect(isAnswered('`a` `b` `c`', 3)).toBe(true);
    expect(isAnswered('`a` `b`', 3)).toBe(false);
  });

  it('treats any known probe command as an answer', () => {
    expect(isAnswered('see `jq ".skills | length" plugin.json`', 25)).toBe(
      true,
    );
  });
});
