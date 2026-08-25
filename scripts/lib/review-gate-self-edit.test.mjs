/**
 * Whether the sweep should have an opinion about a pull request at all.
 *
 * The sweep runs the DEFAULT BRANCH's gate code — GitHub gives a `schedule` no
 * other choice — so on a pull request that edits a gate it would judge the change
 * with the code being replaced. #868 stopped it taking a `success` away; this is
 * the other half, which is that it must not hand one out (#884).
 *
 * The closure is derived rather than listed on purpose, so these assert the
 * derivation and not a roster: a fixture whose deepest module is only reachable
 * through two hops fails if the walk stops at one.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  gateJudgesItsOwnEdit,
  localModuleClosure,
  sweepSummary,
  withheldResult,
} from './review-gate-reconcile.mjs';
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
    // `deep.mjs` is imported by `helper.mjs`, never by the entry. A walk that
    // read the entry and stopped would pass every other assertion here.
    expect(closure()).toContain('scripts/lib/deep.mjs');
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
    // The derivation is worth nothing if it cannot walk the actual tree.
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
    expect(real).toContain('scripts/lib/review-gate-reconcile.mjs');
  });
});

describe('the precondition the walk depends on', () => {
  // `localModuleClosure` follows relative, single-quoted specifiers. That reaches
  // everything today because these scripts import nothing else — but a gate that
  // later pulls in a workspace package, or quotes an import with `"`, would drop
  // silently out of its own closure and the sweep would start publishing on a
  // self-edit again. Narrowing is the failure direction that matters, so the
  // convention is asserted rather than trusted.
  const GATE_ENTRIES = [
    'scripts/copilot-review-status.mjs',
    'scripts/verify-agent-review.mjs',
    'scripts/verify-review-threads.mjs',
  ];
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

  /**
   * The specifier on every real import line, comments excluded.
   *
   * Scanning raw source finds prose: `pr-threads-api.mjs` contains the phrase
   * `from "could not read it"` in a docblock, which a naive match reads as an
   * import of a package called `could not read it`. The closure's own walk is
   * immune — it only accepts specifiers starting with `.` — but a check that
   * cries wolf gets deleted, so this one reads import lines only.
   */
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

  it('withholds an unreadable file list, and calls it a FAILURE', () => {
    // The distinction is the whole alarm. A secondary rate limit part-way
    // through a sweep withholds every remaining gate; reporting those as `ok`
    // summarises `0 failure(s)`, exits 0, files no tracking issue, and statuses
    // silently stop being corrected while every pull request looks normal.
    const result = withheldResult({ changedFiles: undefined, gate, number: 7 });
    expect(result?.ok).toBe(false);
    expect(result?.output).toMatch(
      /could not read what this pull request changed/u,
    );
  });

  it('is counted as a failure by the summary the sweep exits on', () => {
    // Asserted through `sweepSummary` rather than on the flag, because the flag
    // only matters via the count that decides the exit code.
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
  // Every assertion above passes with the decision never called. #866 and #868
  // are both cases where the wiring, not the logic, was the defect. Asserted as
  // an invariant rather than a shape: whatever the expression looks like, the
  // sweep must not reach `runGate` without offering the decision first.
  const source = () => readRepoFile('scripts/reconcile-review-gates.mjs');

  it('never assigns a gate result without consulting the decision', () => {
    expect(source()).not.toMatch(/const result =\s*runGate\(/u);
    expect(source()).toMatch(/const result =\s*withheldResult\(/u);
  });

  it('asks about the files this pull request changed', () => {
    expect(source()).toMatch(/pulls\/\$\{number\}\/files/u);
  });

  it('derives each gate’s closure from its own script', () => {
    expect(source()).toMatch(
      /localModuleClosure\(\{[\s\S]{0,200}?gate\.script/u,
    );
  });

  it('does not let one pull request’s failure end the sweep', () => {
    // `fetchChangedFiles` runs per pull request, so an unguarded throw would
    // abandon every pull request after it — where a gate failure costs one line.
    expect(source()).toMatch(
      /const fetchChangedFiles[\s\S]{0,600}?\}\s*catch\s*\(/u,
    );
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
        changedFiles: ['apps/react-router/src/root.tsx'],
        closure,
      }),
    ).toBe(false);
  });

  it('matches on the path, not on the file name', () => {
    // `helper.mjs` somewhere else is a different file and must not withhold.
    expect(
      gateJudgesItsOwnEdit({
        changedFiles: ['apps/react-router/helper.mjs'],
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
