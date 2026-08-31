import { describe, expect, it } from 'vite-plus/test';

import {
  planningProblems,
  registerFindings,
  requirementProblems,
} from './doc-register-checks.mjs';
import { toEntry } from './doc-registers.mjs';

const CONTEXT = {
  ciCommands: new Set(['test:ci']),
  ids: new Set(['render-a-table', 'sql-is-safe']),
  resolves: (ref) => ref === 'packages/ui/src/public-api.ts',
  rootTasks: new Set(['test:ci', 'suppressions:list']),
  roster: new Set(['ui', 'server']),
};

const REQUIREMENT = `---
id: render-a-table
lines:
  - application
persona: application-developer
state: unmet
packages:
  - ui
requires:
  - sql-is-safe
issues:
  - 994
evidence:
  - type: code
    ref: packages/ui/src/public-api.ts
  - type: command
    ref: vp run suppressions:list
---

# Render a table from rows alone

## Statement

I have rows and columns and want a table.

## Acceptance

- \`packages/ui/src/public-api.ts\` resolves a component taking both.
`;

const PLANNING = `---
kind: plan
status: live
recorded: 2026-08-11
issues: ['#547']
packages: [ui, server]
---

# A plan
`;

const checkRequirement = (source) =>
  requirementProblems(
    toEntry({
      file: 'docs/product/requirements/render-a-table.md',
      register: 'requirement',
      source,
    }),
    CONTEXT,
  );

const checkPlanning = (source, file = 'docs/agents/planning/a-plan.md') =>
  planningProblems(toEntry({ file, register: 'planning', source }), CONTEXT);

const onlyProblem = (problems) => {
  expect(problems).toHaveLength(1);
  return problems[0];
};

describe('a requirement, one line at a time', () => {
  it('passes the register as written', () => {
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails a document carrying no frontmatter block', () => {
    expect(onlyProblem(checkRequirement('# No block\n'))).toContain(
      'no `---` frontmatter block',
    );
  });

  it("fails a typo'd field, which would otherwise read as an absent one", () => {
    const broken = REQUIREMENT.replace('packages:', 'pacakges:');

    expect(checkRequirement(broken)).toEqual([
      'missing field `packages`',
      'unknown field `pacakges`',
    ]);
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails an id that is not the filename slug', () => {
    const broken = REQUIREMENT.replace('id: render-a-table', 'id: other-slug');

    expect(onlyProblem(checkRequirement(broken))).toContain(
      'but the filename slug is `render-a-table`',
    );
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails a product line outside the vocabulary', () => {
    const broken = REQUIREMENT.replace('- application\n', '- platform\n');

    expect(onlyProblem(checkRequirement(broken))).toContain('`lines` item');
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails a persona and a state outside their vocabularies', () => {
    expect(
      onlyProblem(
        checkRequirement(
          REQUIREMENT.replace(
            'persona: application-developer',
            'persona: everyone',
          ),
        ),
      ),
    ).toContain('`persona` must be one of');
    expect(
      onlyProblem(
        checkRequirement(
          REQUIREMENT.replace('state: unmet', 'state: partially'),
        ),
      ),
    ).toContain('`state` must be one of');
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails a package name absent from the derived workspace roster', () => {
    const broken = REQUIREMENT.replace('  - ui\n', '  - @lcabrera/ui\n');

    expect(onlyProblem(checkRequirement(broken))).toContain(
      'must be a workspace directory name',
    );
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails a `requires` naming no requirement in the register', () => {
    const broken = REQUIREMENT.replace(
      '- sql-is-safe',
      '- no-such-requirement',
    );

    expect(onlyProblem(checkRequirement(broken))).toContain(
      'must be the id of another requirement',
    );
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails a `#`-prefixed issue number', () => {
    const broken = REQUIREMENT.replace('- 994', '- #994');

    expect(onlyProblem(checkRequirement(broken))).toContain(
      'must be a bare issue number',
    );
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails an evidence pointer that resolves to nothing', () => {
    const broken = REQUIREMENT.replace(
      'packages/ui/src/public-api.ts',
      'packages/ui/src/departed.ts',
    );

    expect(onlyProblem(checkRequirement(broken))).toContain(
      'resolves to nothing in this repo',
    );
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails a command pointer naming no root task', () => {
    const broken = REQUIREMENT.replace(
      'vp run suppressions:list',
      'vp run nothing:here',
    );

    expect(onlyProblem(checkRequirement(broken))).toContain(
      'names no task in the root manifest',
    );
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails `met` with no command pointer CI runs, and passes with one', () => {
    const claimed = REQUIREMENT.replace('state: unmet', 'state: met');

    expect(onlyProblem(checkRequirement(claimed))).toContain(
      'carries no `command` evidence pointer that CI runs',
    );
    expect(
      checkRequirement(
        claimed.replace('vp run suppressions:list', 'vp run test:ci'),
      ),
    ).toEqual([]);
  });

  it('fails a body missing a required section', () => {
    const broken = REQUIREMENT.replace('## Acceptance', '## Criteria');

    expect(onlyProblem(checkRequirement(broken))).toContain(
      'no `## Acceptance` section',
    );
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });

  it('fails an acceptance checkbox, which is a second `state`', () => {
    const broken = REQUIREMENT.replace('- `packages', '- [x] `packages');

    expect(onlyProblem(checkRequirement(broken))).toContain(
      '`state` is the one declaration',
    );
    expect(checkRequirement(REQUIREMENT)).toEqual([]);
  });
});

describe('a planning document, one line at a time', () => {
  it('passes the block as written', () => {
    expect(checkPlanning(PLANNING)).toEqual([]);
  });

  it('fails a plan carrying no issue reference', () => {
    const broken = PLANNING.replace("issues: ['#547']", 'issues: []');

    expect(onlyProblem(checkPlanning(broken))).toContain(
      '`kind: plan` names no issue',
    );
    expect(checkPlanning(PLANNING)).toEqual([]);
  });

  it('passes a charter with no issue', () => {
    const charter = PLANNING.replace('kind: plan', 'kind: charter').replace(
      "issues: ['#547']",
      'issues: []',
    );

    expect(checkPlanning(charter)).toEqual([]);
  });

  it('fails a kind and a status outside their vocabularies', () => {
    expect(
      onlyProblem(checkPlanning(PLANNING.replace('kind: plan', 'kind: draft'))),
    ).toContain('`kind` must be one of');
    expect(
      onlyProblem(
        checkPlanning(PLANNING.replace('status: live', 'status: wip')),
      ),
    ).toContain('`status` must be one of');
  });

  it('fails a `recorded` that is not a real date', () => {
    expect(
      onlyProblem(checkPlanning(PLANNING.replace('2026-08-11', '2026-02-31'))),
    ).toContain('must be a YYYY-MM-DD date');
    expect(
      onlyProblem(checkPlanning(PLANNING.replace('2026-08-11', 'August 2026'))),
    ).toContain('must be a YYYY-MM-DD date');
    expect(checkPlanning(PLANNING)).toEqual([]);
  });

  it('fails a bare issue number, which the other register requires', () => {
    const broken = PLANNING.replace("issues: ['#547']", 'issues: [547]');

    expect(onlyProblem(checkPlanning(broken))).toContain(
      'must be a `#`-prefixed issue number',
    );
    expect(checkPlanning(PLANNING)).toEqual([]);
  });

  it('fails a package name absent from the roster', () => {
    const broken = PLANNING.replace('[ui, server]', '[ui, @lcabrera/server]');

    expect(onlyProblem(checkPlanning(broken))).toContain(
      'must be a workspace directory name',
    );
    expect(checkPlanning(PLANNING)).toEqual([]);
  });
});

describe('the register as a whole', () => {
  it('refuses to pass having read no entries', () => {
    const nothing = registerFindings({
      ...CONTEXT,
      planning: [],
      requirements: [],
    });

    expect(nothing.map(({ file }) => file)).toEqual([
      'docs/product/requirements',
      'docs/agents/planning',
    ]);
    for (const finding of nothing) {
      expect(finding.message).toContain('refusing to report a clean pass');
    }
  });
});
