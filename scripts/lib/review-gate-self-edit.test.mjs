/**
 * Whether the sweep should have an opinion about a pull request at all —
 * ADR-076, #884 amendment.
 *
 * These assert the closure's DERIVATION, not a roster: a hand-listed closure is
 * the thing that rots silently.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  completeFileList,
  gateClosure,
  gateJudgesItsOwnEdit,
  localModuleClosure,
  sweepSummary,
  withheldResult,
} from '../../packages/repo-standards/scripts/review-gate-reconcile.mjs';
import { REVIEW_GATES } from './review-gate-roster.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

describe('the code a gate actually runs', () => {
  const FIXTURE = {
    'scripts/gate.mjs': `
      import { readFileSync } from 'node:fs';
      import { helper } from './lib/helper.mjs';
      import { shared } from '../packages/repo-standards/scripts/shared.mjs';
    `,
    'scripts/lib/helper.mjs': `import { deep } from './deep.mjs';`,
    'scripts/lib/deep.mjs': `export const deep = 1;`,
    'packages/repo-standards/scripts/shared.mjs': `export const shared = 2;`,
  };
  const readFixture = (path) => FIXTURE[path];
  const closure = () =>
    localModuleClosure({ entry: 'scripts/gate.mjs', readFile: readFixture });

  it('follows relative imports transitively, and keeps the entry', () => {
    expect(closure()).toEqual([
      'packages/repo-standards/scripts/shared.mjs',
      'scripts/gate.mjs',
      'scripts/lib/deep.mjs',
      'scripts/lib/helper.mjs',
    ]);
  });

  it('reaches a module only the second hop can find', () => {
    expect(closure()).toContain('scripts/lib/deep.mjs');
  });

  it('unions the driver that runs the gate into the gate’s closure', () => {
    const withDriver = gateClosure({
      driverEntry: 'scripts/driver.mjs',
      entry: 'scripts/gate.mjs',
      readFile: (path) =>
        path === 'scripts/driver.mjs'
          ? `import { only } from './lib/driver-only.mjs';`
          : { ...FIXTURE, 'scripts/lib/driver-only.mjs': '' }[path],
    });
    expect(withDriver).toContain('scripts/driver.mjs');
    expect(withDriver).toContain('scripts/lib/driver-only.mjs');
    expect(withDriver).toContain('scripts/lib/deep.mjs');
  });

  it('leaves builtins out — they cannot be edited by a pull request', () => {
    expect(closure().some((module) => module.startsWith('node:'))).toBe(false);
  });

  it('survives an import that resolves to nothing', () => {
    expect(
      localModuleClosure({
        entry: 'scripts/gate.mjs',
        readFile: (path) =>
          path === 'scripts/lib/helper.mjs' ? undefined : readFixture(path),
      }),
    ).toContain('scripts/lib/helper.mjs');
  });

  it('terminates on a cycle', () => {
    const cyclic = {
      'a.mjs': `import './b.mjs';`,
      'b.mjs': `import './a.mjs';`,
    };
    expect(
      localModuleClosure({ entry: 'a.mjs', readFile: (p) => cyclic[p] }),
    ).toEqual(['a.mjs', 'b.mjs']);
  });

  it('is what the real gates resolve to, not just the fixture', () => {
    const real = localModuleClosure({
      entry: 'scripts/copilot-review-status.mjs',
      readFile: (path) => {
        try {
          return readRepoFile(path);
        } catch {
          return undefined;
        }
      },
    });
    expect(real).toContain('scripts/copilot-review-status.mjs');
    expect(real).toContain('scripts/lib/copilot-review.mjs');
    expect(real).toContain(
      'packages/repo-standards/scripts/review-gate-reconcile.mjs',
    );
    expect(real).not.toContain('scripts/reconcile-review-gates.mjs');
  });

  it('puts the real driver into every real gate’s closure', () => {
    for (const { script } of REVIEW_GATES) {
      expect(
        gateClosure({
          driverEntry: 'scripts/reconcile-review-gates.mjs',
          entry: script,
          readFile: (path) => {
            try {
              return readRepoFile(path);
            } catch {
              return undefined;
            }
          },
        }),
      ).toContain('scripts/reconcile-review-gates.mjs');
    }
  });
});

describe('the precondition the walk depends on', () => {
  const GATE_ENTRIES = REVIEW_GATES.map((gate) => gate.script);
  const closureOf = (entry) =>
    localModuleClosure({
      entry,
      readFile: (path) => {
        try {
          return readRepoFile(path);
        } catch {
          return undefined;
        }
      },
    });

  const importSpecifiers = (source) =>
    source
      .split('\n')
      .filter((line) => {
        const trimmed = line.trim();
        return (
          !trimmed.startsWith('*') &&
          !trimmed.startsWith('//') &&
          /^(?:import\b|export\b|\}).*\bfrom\s+['"]/u.test(trimmed)
        );
      })
      .flatMap((line) => {
        const match = /\bfrom\s+['"]([^'"]+)['"]/u.exec(line);
        return match === null ? [] : [{ quote: line, specifier: match[1] }];
      });

  const allModules = () => [...new Set(GATE_ENTRIES.flatMap(closureOf))];

  it('imports nothing but `node:` builtins and relative paths', () => {
    const foreign = allModules().flatMap((module) =>
      importSpecifiers(readRepoFile(module)).flatMap(({ specifier }) =>
        specifier.startsWith('.') || specifier.startsWith('node:')
          ? []
          : [`${module} -> ${specifier}`],
      ),
    );
    expect(foreign).toEqual([]);
  });

  it('quotes every import with a single quote', () => {
    const doubleQuoted = allModules().flatMap((module) =>
      importSpecifiers(readRepoFile(module)).flatMap(({ quote }) =>
        /\bfrom\s+"/u.test(quote) ? [`${module}: ${quote.trim()}`] : [],
      ),
    );
    expect(doubleQuoted).toEqual([]);
  });
});

describe('what the sweep does instead of running a gate', () => {
  const gate = { closure: ['scripts/gate.mjs'], name: 'copilot-review' };

  it('runs the gate for an ordinary pull request', () => {
    expect(
      withheldResult({ changedFiles: ['README.md'], gate, number: 7 }),
    ).toBeUndefined();
  });

  it('withholds a self-edit, and calls it a decision rather than a failure', () => {
    const result = withheldResult({
      changedFiles: ['scripts/gate.mjs'],
      gate,
      number: 7,
    });
    expect(result?.ok).toBe(true);
    expect(result?.output).toMatch(/edits the code this gate runs/u);
  });

  it('judges a pull request whose diff is empty', () => {
    expect(
      withheldResult({ changedFiles: [], gate, number: 7 }),
    ).toBeUndefined();
  });

  it('withholds an unreadable file list, and calls it a FAILURE', () => {
    const result = withheldResult({ changedFiles: undefined, gate, number: 7 });
    expect(result?.ok).toBe(false);
    expect(result?.output).toMatch(
      /could not read what this pull request changed/u,
    );
  });

  it('is counted as a failure by the summary the sweep exits on', () => {
    const unreadable = withheldResult({
      changedFiles: undefined,
      gate,
      number: 7,
    });
    const selfEdit = withheldResult({
      changedFiles: ['scripts/gate.mjs'],
      gate,
      number: 8,
    });
    expect(
      sweepSummary({ pullRequests: [7, 8], results: [unreadable, selfEdit] })
        .failures,
    ).toEqual([unreadable]);
  });

  it('names the gate and the pull request it withheld', () => {
    expect(
      withheldResult({ changedFiles: ['scripts/gate.mjs'], gate, number: 7 }),
    ).toMatchObject({ gate: 'copilot-review', number: 7 });
  });
});

describe('the sweep actually consults it — not a parallel definition', () => {
  const source = () => readRepoFile('scripts/reconcile-review-gates.mjs');

  const declarationOf = (name) => {
    const text = source();
    const start = text.indexOf(`const ${name} =`);
    expect(start).toBeGreaterThan(-1);
    const end = text.indexOf('\n};', start);
    expect(end).toBeGreaterThan(start);
    const slice = text.slice(start, end);
    expect(slice).not.toMatch(/\n(?:const|export) /u);
    return slice;
  };

  it('never assigns a gate result without consulting the decision', () => {
    expect(source()).not.toMatch(/const result =\s*runGate\(/u);
    expect(source()).toMatch(/const result =\s*withheldResult\(/u);
  });

  it('closes over the driver too, not just the gate script', () => {
    expect(source()).toMatch(/gateClosure\(/u);
    expect(source()).not.toMatch(/localModuleClosure\(/u);
  });

  it('derives its own path rather than writing it down', () => {
    expect(source()).not.toMatch(/'scripts\/reconcile-review-gates\.mjs'/u);
    expect(source()).toMatch(/driverEntry: DRIVER_MODULE/u);
  });

  it('asks about the files this pull request changed', () => {
    expect(source()).toMatch(/pulls\/\$\{number\}\/files/u);
  });

  it('asks gh for filenames, not for the diff', () => {
    expect(source()).toMatch(/'--jq',\s*'\.\[\]\.filename'/u);
    expect(declarationOf('fetchChangedFiles')).not.toMatch(/JSON\.parse\(/u);
  });

  it('asks how many files the pull request changed, and consults the check', () => {
    expect(source()).toMatch(/'\.changed_files'/u);
    expect(source()).toMatch(/return completeFileList\(/u);
  });

  it('derives each gate’s closure from its own script', () => {
    expect(source()).toMatch(/entry: gate\.script/u);
  });

  it('reads the roster instead of declaring a second one', () => {
    expect(source()).toMatch(/REVIEW_GATES\.map\(/u);
    expect(source()).not.toMatch(/const GATES =/u);
  });

  it('does not let one pull request’s failure end the sweep', () => {
    expect(declarationOf('fetchChangedFiles')).toMatch(/\}\s*catch\s*\(/u);
  });
});

describe('the roster the sweep runs', () => {
  it('names a script that exists, for every gate', () => {
    const missing = REVIEW_GATES.flatMap(({ name, script }) => {
      try {
        readRepoFile(script);
        return [];
      } catch {
        return [`${name} -> ${script}`];
      }
    });
    expect(missing).toEqual([]);
  });

  it('spells every script from the repository root', () => {
    const bare = REVIEW_GATES.filter(({ script }) => !script.includes('/'));
    expect(bare).toEqual([]);
  });

  it('names each gate once', () => {
    const names = REVIEW_GATES.map((gate) => gate.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('whether the changed-file list can be trusted', () => {
  it('accepts a list that accounts for every changed file', () => {
    expect(
      completeFileList({ expected: '2', filenames: ['a.mjs', 'b.mjs'] }),
    ).toEqual(['a.mjs', 'b.mjs']);
  });

  it('accepts an empty list for a pull request whose diff has gone empty', () => {
    expect(completeFileList({ expected: '0', filenames: [] })).toEqual([]);
  });

  it('rejects a list the files endpoint capped', () => {
    expect(
      completeFileList({
        expected: '3200',
        filenames: Array.from({ length: 3000 }, () => 'a.mjs'),
      }),
    ).toBeUndefined();
  });

  it('rejects a count that came back empty', () => {
    expect(
      completeFileList({ expected: '', filenames: ['a.mjs'] }),
    ).toBeUndefined();
  });

  it('rejects a count that came back null', () => {
    expect(
      completeFileList({ expected: 'null', filenames: ['a.mjs'] }),
    ).toBeUndefined();
  });

  it('accepts a list longer than expected, which is a push mid-read', () => {
    expect(
      completeFileList({ expected: '1', filenames: ['a.mjs', 'b.mjs'] }),
    ).toEqual(['a.mjs', 'b.mjs']);
  });
});

describe('whether the sweep should judge a pull request at all', () => {
  const closure = ['scripts/gate.mjs', 'scripts/lib/helper.mjs'];

  it('withholds when the pull request edits the code this gate runs', () => {
    expect(
      gateJudgesItsOwnEdit({
        changedFiles: ['README.md', 'scripts/lib/helper.mjs'],
        closure,
      }),
    ).toBe(true);
  });

  it('judges an ordinary pull request', () => {
    expect(
      gateJudgesItsOwnEdit({
        changedFiles: ['apps/showcase/src/root.tsx'],
        closure,
      }),
    ).toBe(false);
  });

  it('matches on the path, not on the file name', () => {
    expect(
      gateJudgesItsOwnEdit({
        changedFiles: ['apps/showcase/helper.mjs'],
        closure,
      }),
    ).toBe(false);
  });

  it('compares normalised paths, so `./scripts/x` is `scripts/x`', () => {
    expect(
      gateJudgesItsOwnEdit({ changedFiles: ['./scripts/gate.mjs'], closure }),
    ).toBe(true);
  });

  it('judges when nothing changed and when the closure is empty', () => {
    expect(gateJudgesItsOwnEdit({ changedFiles: [], closure })).toBe(false);
    expect(gateJudgesItsOwnEdit({})).toBe(false);
  });
});
