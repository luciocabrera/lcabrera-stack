/**
 * Whether the sweep should have an opinion about a pull request at all —
 * ADR-076, #884 amendment.
 *
 * These assert the closure's DERIVATION, not a roster: a hand-listed closure is
 * the thing that rots silently.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  gateClosure,
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
    // A walk that read the entry and stopped passes every other assertion here.
    expect(closure()).toContain('scripts/lib/deep.mjs');
  });

  it('unions the driver that runs the gate into the gate’s closure', () => {
    // The driver picks the gate's argv, so editing it alone changes every run.
    const withDriver = gateClosure({
      driverEntry: 'scripts/driver.mjs',
      entry: 'scripts/gate.mjs',
      readFile: (path) =>
        path === 'scripts/driver.mjs'
          ? `import { only } from './lib/driver-only.mjs';`
          : { ...FIXTURE, 'scripts/lib/driver-only.mjs': '' }[path],
    });
    expect(withDriver).toContain('scripts/driver.mjs');
    // Transitive, not just the entry; and the gate's own side survives.
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
    // No gate imports the driver — the gap `gateClosure` closes. Asserted so the
    // union test below measures a real absence, not an assumed one.
    expect(real).not.toContain('scripts/reconcile-review-gates.mjs');
  });

  it('puts the real driver into every real gate’s closure', () => {
    for (const script of [
      'scripts/copilot-review-status.mjs',
      'scripts/verify-agent-review.mjs',
      'scripts/verify-review-threads.mjs',
    ]) {
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
  // The walk follows relative, single-quoted specifiers only. A gate that later
  // imports a workspace package, or uses `"`, would drop silently out of its own
  // closure — so the convention is asserted rather than trusted.
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
   * The specifier on every real import line, comments excluded — `pr-threads-api.mjs`
   * has `from "could not read it"` in prose, which a raw scan reads as an import.
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

  it('judges a pull request whose diff is empty', () => {
    // An open pull request can have zero files (head force-pushed to the merge
    // base), so `[]` and `undefined` are different answers.
    expect(
      withheldResult({ changedFiles: [], gate, number: 7 }),
    ).toBeUndefined();
  });

  it('withholds an unreadable file list, and calls it a FAILURE', () => {
    // A rate limit part-way through a sweep withholds every remaining gate.
    // Reporting those as `ok` exits 0 having corrected nothing.
    const result = withheldResult({ changedFiles: undefined, gate, number: 7 });
    expect(result?.ok).toBe(false);
    expect(result?.output).toMatch(
      /could not read what this pull request changed/u,
    );
  });

  it('is counted as a failure by the summary the sweep exits on', () => {
    // Through `sweepSummary`: the flag only matters via the exit-code count.
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
  // Every assertion above passes with the decision never called — #866 and #868
  // were both wiring, not logic.
  const source = () => readRepoFile('scripts/reconcile-review-gates.mjs');

  /** One top-level `const <name> = …;` declaration, whole. */
  const declarationOf = (name) => {
    const text = source();
    const start = text.indexOf(`const ${name} =`);
    expect(start).toBeGreaterThan(-1);
    const end = text.indexOf('\n};', start);
    expect(end).toBeGreaterThan(start);
    const slice = text.slice(start, end);
    // `\n};` only terminates a BLOCK-bodied arrow; on an expression-bodied one it
    // runs into the next declaration. Fail here rather than silently widen.
    expect(slice).not.toMatch(/\n(?:const|export) /u);
    return slice;
  };

  it('never assigns a gate result without consulting the decision', () => {
    expect(source()).not.toMatch(/const result =\s*runGate\(/u);
    expect(source()).toMatch(/const result =\s*withheldResult\(/u);
  });

  it('closes over the driver too, not just the gate script', () => {
    // Whole-file because `gatesWithClosures` is expression-bodied, so
    // `declarationOf` cannot bound it. The un-unioned walk is named, so its
    // absence anywhere in the driver is the assertion.
    expect(source()).toMatch(/gateClosure\(/u);
    expect(source()).not.toMatch(/localModuleClosure\(/u);
  });

  it('derives its own path rather than writing it down', () => {
    // A literal would stop matching on a rename, and a sweep that publishes where
    // it should withhold looks exactly like a healthy one.
    expect(source()).not.toMatch(/'scripts\/reconcile-review-gates\.mjs'/u);
    expect(source()).toMatch(/driverEntry: DRIVER_MODULE/u);
  });

  it('asks about the files this pull request changed', () => {
    expect(source()).toMatch(/pulls\/\$\{number\}\/files/u);
  });

  it('asks gh for filenames, not for the diff', () => {
    // Every entry carries its `patch`, so parsing the payload puts the sweep's
    // only diff-sized response against `runGh`'s 8 MB cap.
    expect(source()).toMatch(/'--jq',\s*'\.\[\]\.filename'/u);
    // Scoped, not windowed: the only `JSON.parse(` here is in
    // `fetchOpenPullRequests`, so a window measures that function's formatting.
    expect(declarationOf('fetchChangedFiles')).not.toMatch(/JSON\.parse\(/u);
  });

  it('reads an empty file list as no files, not as an unreadable one', () => {
    // The read side of the test above: `gh` exits 0 and prints nothing for a
    // pull request whose diff has gone empty.
    const body = declarationOf('fetchChangedFiles');
    expect(body).toMatch(/return filenames;/u);
    expect(body).not.toMatch(/filenames\.length/u);
  });

  it('derives each gate’s closure from its own script', () => {
    // Exact, not a window: each gate's entry is that gate's own script.
    expect(source()).toMatch(/entry: `scripts\/\$\{gate\.script\}`/u);
  });

  it('does not let one pull request’s failure end the sweep', () => {
    // Runs per pull request, so an unguarded throw abandons every one after it.
    expect(declarationOf('fetchChangedFiles')).toMatch(/\}\s*catch\s*\(/u);
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
