/**
 * The sweep's wiring: the argv it hands each gate, and the call sites that turn
 * a `--pr` into a number. Split from `review-gate-reconcile.test.mjs`, which
 * owns the decisions those arguments feed.
 *
 * Every assertion here is written to fail on a shape that is invisible in the
 * outcome of getting it wrong — a flag that stopped being passed, or a parser
 * that stopped being called, both leave a sweep that still reports "ok".
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  gateArgs,
  gateJudgesItsOwnEdit,
  localModuleClosure,
  PROTECT_SUCCESS_FLAG,
} from './review-gate-reconcile.mjs';
import { readRepoFile } from './workflow-inspect.mjs';

describe('the argv the sweep hands each gate', () => {
  // Asserted on the ARGV rather than on the effect, deliberately: both entries
  // below are invisible in the outcome of getting them wrong — a sweep missing
  // `--if-changed` still reports "ok" on every line while quietly re-posting an
  // identical status every pass, and one missing `--repo` still works whenever
  // the gate happens to resolve the same repository by itself. An end-to-end
  // test would need a live pull request and would still not fail on the second.
  const args = () =>
    gateArgs({
      number: 738,
      repository: 'luciocabrera/vite-react-compiler',
      script: '/repo/scripts/copilot-review-status.mjs',
    });

  it('is exactly this, so a silent addition or removal shows up here', () => {
    expect(args()).toEqual([
      '/repo/scripts/copilot-review-status.mjs',
      '--pr',
      '738',
      '--repo',
      'luciocabrera/vite-react-compiler',
      '--if-changed',
    ]);
  });

  it('always passes --if-changed, which IS the sweep’s idempotence', () => {
    expect(args()).toContain('--if-changed');
  });

  it('tells the gate which repository the sweep listed', () => {
    const argv = args();
    expect(argv[argv.indexOf('--repo') + 1]).toBe(
      'luciocabrera/vite-react-compiler',
    );
  });

  it('stringifies the number, so 738 and "738" build one argv', () => {
    expect(
      gateArgs({ number: '738', repository: 'o/r', script: 's.mjs' }),
    ).toEqual(gateArgs({ number: 738, repository: 'o/r', script: 's.mjs' }));
  });

  it('appends the caller’s extra flags after its own', () => {
    expect(
      gateArgs({
        extraArgs: ['--dry-run'],
        number: 738,
        repository: 'o/r',
        script: 's.mjs',
      }).at(-1),
    ).toBe('--dry-run');
  });

  it('is exactly this when a gate opts in, so the flag cannot go missing', () => {
    expect(
      gateArgs({
        number: 738,
        protectSuccess: true,
        repository: 'luciocabrera/vite-react-compiler',
        script: '/repo/scripts/copilot-review-status.mjs',
      }),
    ).toEqual([
      '/repo/scripts/copilot-review-status.mjs',
      '--pr',
      '738',
      '--repo',
      'luciocabrera/vite-react-compiler',
      '--if-changed',
      PROTECT_SUCCESS_FLAG,
    ]);
  });

  it('hands the gate the flag the gate itself reads', () => {
    // The two sides used to spell the string separately, and a rename of either
    // one left the whole suite green while every gate quietly went unprotected
    // — the argv test above asserts the default, and the roster test only reads
    // the text of `GATES`. Sharing the constant is what fixes it; this asserts
    // the read side still reads it rather than growing its own copy back.
    const source = readRepoFile('scripts/lib/review-gate-status.mjs');
    expect(source).toMatch(
      /protectSuccess:\s*process\.argv\.includes\(PROTECT_SUCCESS_FLAG\)/,
    );
    expect(source).not.toMatch(/'--protect-success'/);
  });

  it('only lets a gate opt in if its script can read the flag', () => {
    // `--protect-success` is read inside `publishGateStatus`. A gate that posts
    // its own status instead — `verify-agent-review.mjs` does — would take the
    // flag and ignore it, which is the same silent no-op this flag already had
    // once. The roster test next door pins WHICH gates opt in; this pins that
    // opting in can do anything at all.
    const sweep = readRepoFile('scripts/reconcile-review-gates.mjs');
    const optedIn = [...sweep.matchAll(/\{[^}]*script:\s*'([\w.-]+)'[^}]*\}/gu)]
      .filter((entry) => entry[0].includes('protectSuccess'))
      .map((entry) => entry[1]);

    expect(optedIn).not.toHaveLength(0);
    for (const script of optedIn) {
      expect(readRepoFile(`scripts/${script}`)).toContain('publishGateStatus');
    }
  });

  it('is what the sweep actually spawns — not a parallel definition', () => {
    // The assertions above are worth nothing if the sweep builds its own argv
    // beside them, so this pins the wiring: one child spawn in that file, and it
    // takes the argv from `gateArgs`.
    const source = readRepoFile('scripts/reconcile-review-gates.mjs');
    expect(source.match(/execFileSync\(/g)).toHaveLength(1);
    expect(source).toMatch(/execFileSync\(\s*process\.execPath,\s*args\b/);
    expect(source).toMatch(/const args = gateArgs\(/);
  });
});

// `--pr '#738'` used to become `NaN` and reach `pulls/NaN`: a 404 per gate and
// nothing naming the input. The parsers that fix it live in `cli-input.mjs` and
// are unit-tested there — but unwiring a CALL leaves those tests green, so the
// call sites are what these assert. A `parsePullNumber(` with a paren appears
// only at a call site; the import lists the name without one.
//
// The gate scripts no longer parse for themselves: `review-gate-status.mjs`
// resolves the pull request and the repository for both of them, so the call
// site moved rather than disappearing. Splitting the list keeps the property
// exact — one file must hold the calls, and a delegating gate must be shown to
// reach them rather than to have dropped them.
describe('the scripts that take a pull request on the command line', () => {
  const PARSE_DIRECTLY = [
    'scripts/reconcile-review-gates.mjs',
    'scripts/verify-agent-review.mjs',
    'scripts/lib/review-gate-status.mjs',
  ];

  const DELEGATE = [
    'scripts/copilot-review-status.mjs',
    'scripts/pr-threads.mjs',
    'scripts/verify-review-threads.mjs',
  ];

  for (const script of PARSE_DIRECTLY) {
    it(`${script} parses --pr and --repo instead of using them raw`, () => {
      const source = readRepoFile(script);
      expect(source).toMatch(/parsePullNumber\(/);
      expect(source).toMatch(/parseRepository\(/);
    });
  }

  for (const script of DELEGATE) {
    it(`${script} takes both from review-gate-status, never from argv`, () => {
      const source = readRepoFile(script);
      // Either entry point counts: the gates take the whole target through
      // `resolveGateTarget`, while `pr-threads.mjs` calls the two resolvers
      // itself because it also falls back to the current branch. What matters
      // is that the parsing happens in the shared module, not here.
      expect(source).toMatch(
        /import \{[^}]*(?:resolveGateTarget|resolvePullNumber)[^}]*\} from '\.\/lib\/review-gate-status\.mjs'/s,
      );
      // The failure this forbids: a script that reaches past the shared
      // resolver and reads the flag itself, which is how one of them would
      // drift back to an unparsed `#738`.
      expect(source).not.toMatch(/flagValue\('--pr'\)/);
      expect(source).not.toMatch(/flagValue\('--repo'\)/);
    });
  }

  it('the sweep parses both before it can read or publish anything', () => {
    // Specifically these two call sites, because the failure they prevent is a
    // sweep that runs both gates against `#NaN` — or, for a typo, one that falls
    // through and reconciles every open pull request.
    const source = readRepoFile(PARSE_DIRECTLY[0]);
    expect(source).toMatch(/parseRepository\(resolveRepository\(\)\)/);
    expect(source).toMatch(/parsePullNumber\(only\)/);
    // `\b` is load-bearing: `Number(only)` is a substring of
    // `parsePullNumber(only)`, so without it this negative can never hold — the
    // same shared-anchor mistake this file's other tests were rewritten to avoid.
    expect(source).not.toMatch(/\bNumber\(only\)/);
  });
});

// The sweep runs the DEFAULT BRANCH's gate code — GitHub gives a `schedule` no
// other choice — so on a pull request that edits a gate it is judging the change
// with the code being replaced. #868 stopped it taking a `success` away; these
// pin the other half, which is that it must not hand one out (#884).
//
// The closure is derived rather than listed on purpose, so these assert the
// derivation and not a roster: a fixture whose deepest module is only reachable
// through two hops fails if the walk stops at one.
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

describe('the sweep actually consults it — not a parallel definition', () => {
  // Every assertion above passes with the decision never called. #866 and #868
  // are both cases where the wiring, not the logic, was the defect.
  const source = () => readRepoFile('scripts/reconcile-review-gates.mjs');

  it('withholds before it would spawn the gate', () => {
    // The guard has to sit on the path to `runGate`, not beside it.
    expect(source()).toMatch(
      /gateJudgesItsOwnEdit\(\{[^}]*\}\)\s*\?[\s\S]{0,400}?:\s*runGate\(/,
    );
  });

  it('asks about the files this pull request changed', () => {
    expect(source()).toMatch(/pulls\/\$\{number\}\/files/);
    expect(source()).toMatch(/changedFiles/);
  });

  it('derives each gate’s closure from its own script', () => {
    expect(source()).toMatch(
      /localModuleClosure\(\{[\s\S]{0,200}?gate\.script/,
    );
  });

  it('says why it withheld, rather than reporting a silent success', () => {
    // A withheld gate that reports a bare `ok` is indistinguishable from one
    // that published, which is the failure this whole sweep exists to avoid.
    expect(source()).toMatch(/Withheld:[^']*#884/);
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
