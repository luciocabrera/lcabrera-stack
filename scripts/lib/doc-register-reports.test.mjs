import { describe, expect, it } from 'vite-plus/test';

import {
  distanceReport,
  packageDocsReport,
  RESOLUTION_NOTICE,
} from './doc-register-reports.mjs';
import { toEntry } from './doc-registers.mjs';

const requirement = ({
  evidence = 'packages/ui/src/public-api.ts',
  id,
  packages,
  state,
}) =>
  toEntry({
    file: `docs/product/requirements/${id}.md`,
    register: 'requirement',
    source: `---
id: ${id}
lines:
  - application
persona: data-user
state: ${state}
packages: [${packages}]
requires: []
issues:
  - 1
evidence:
  - type: code
    ref: ${evidence}
---

# ${id}
`,
  });

const REQUIREMENTS = [
  requirement({ id: 'a', packages: 'ui', state: 'met' }),
  requirement({ id: 'b', packages: 'ui, server', state: 'unmet' }),
];

const CONTEXT = {
  resolves: (ref) => ref === 'packages/ui/src/public-api.ts',
  rootTasks: new Set(['test:ci']),
};

describe('distanceReport', () => {
  const report = distanceReport({ ...CONTEXT, requirements: REQUIREMENTS });

  it('counts what the register declares, by line, persona and package', () => {
    expect(report).toContain('2 requirement(s) read');
    expect(report).toContain('met       1');
    expect(report).toContain('unmet     1');
    expect(report).toContain('application  1/2 met');
    expect(report).toContain('data-user  1/2 met');
    expect(report).toContain('ui      1/2 met');
    expect(report).toContain('server  0/1 met');
  });

  it('lists each unmet requirement with the issues that would move it', () => {
    expect(report).toContain('b  #1  [ui, server]');
    expect(report).not.toContain('\n  a  ');
  });

  // The claim the report makes about itself has to be one it earns: it really
  // does resolve every pointer, and really does run none of them.
  it('resolves the pointers it counts, and says that is what it did', () => {
    expect(report).toContain('2/2 pointer(s) resolve');
    expect(report).toContain(RESOLUTION_NOTICE);
    expect(RESOLUTION_NOTICE).toContain('Pointers were resolved, not run.');
    expect(RESOLUTION_NOTICE).toContain('This report writes no file.');
  });

  it('names a pointer that resolves to nothing rather than counting it', () => {
    const broken = distanceReport({
      ...CONTEXT,
      requirements: [
        requirement({
          evidence: 'packages/ui/src/gone.ts',
          id: 'c',
          packages: 'ui',
          state: 'unmet',
        }),
      ],
    });

    expect(broken).toContain('0/1 pointer(s) resolve');
    expect(broken).toContain('packages/ui/src/gone.ts (missing)');
  });
});

describe('packageDocsReport', () => {
  const planning = [
    toEntry({
      file: 'docs/agents/planning/a-plan.md',
      register: 'planning',
      source:
        "---\nkind: plan\nstatus: live\nrecorded: 2026-08-11\nissues: ['#547']\npackages: [ui]\n---\n",
    }),
  ];

  it('lists both registers for one workspace', () => {
    const report = packageDocsReport({
      planning,
      requirements: REQUIREMENTS,
      workspace: 'ui',
    });

    expect(report).toContain('Documents concerning `ui` — 3');
    expect(report).toContain('[met]   docs/product/requirements/a.md');
    expect(report).toContain('[plan] docs/agents/planning/a-plan.md  #547');
  });

  it('says so plainly when a workspace owes nothing', () => {
    const report = packageDocsReport({
      planning: [],
      requirements: [],
      workspace: 'utils',
    });

    expect(report).toContain('Documents concerning `utils` — 0');
    expect(report).toContain('Requirements (0)\n  none');
    expect(report).toContain('Planning documents (0)\n  none');
  });
});
