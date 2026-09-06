import { describe, expect, it } from 'vite-plus/test';

import { cycleFindings, duplicateIdFindings } from './doc-register-graph.mjs';
import { toEntry } from './doc-registers.mjs';

// Both rules here are about the register rather than one entry, so both are
// planted: a register with no duplicate and no cycle reports exactly what an
// unwired check reports (AGENTS.md Rule 14), and the passing half of each case
// is the same input with the violation removed.

describe('the register as a whole', () => {
  const entryFor = (id, requires) =>
    toEntry({
      file: `docs/product/requirements/${id}.md`,
      register: 'requirement',
      source: `---\nid: ${id}\nrequires:\n${requires.map((name) => `  - ${name}\n`).join('')}---\n`,
    });

  it('fails two files declaring one id', () => {
    const twice = [
      toEntry({
        file: 'docs/product/requirements/a.md',
        register: 'requirement',
        source: '---\nid: a\n---\n',
      }),
      toEntry({
        file: 'docs/product/requirements/b.md',
        register: 'requirement',
        source: '---\nid: a\n---\n',
      }),
    ];

    expect(duplicateIdFindings(twice)).toEqual([
      {
        file: 'docs/product/requirements/b.md',
        message:
          'duplicate id `a` — already declared by `docs/product/requirements/a.md`',
      },
    ]);
    expect(duplicateIdFindings([twice[0]])).toEqual([]);
  });

  it('fails a `requires` cycle and passes the chain that has an end', () => {
    const cycle = [entryFor('a', ['b']), entryFor('b', ['a'])];
    const chain = [entryFor('a', ['b']), entryFor('b', [])];

    expect(cycleFindings(cycle)).toHaveLength(1);
    expect(cycleFindings(cycle)[0].message).toBe('`requires` cycle: a → b → a');
    expect(cycleFindings(chain)).toEqual([]);
  });

  it('fails a requirement that requires itself', () => {
    expect(cycleFindings([entryFor('a', ['a'])])[0].message).toBe(
      '`requires` cycle: a → a',
    );
  });

  it('reports one finding per cycle, not one per member', () => {
    const three = [
      entryFor('a', ['b']),
      entryFor('b', ['c']),
      entryFor('c', ['a']),
    ];

    expect(cycleFindings(three)).toHaveLength(1);
  });
});
