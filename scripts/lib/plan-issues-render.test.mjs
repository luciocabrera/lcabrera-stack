import { describe, expect, it } from 'vite-plus/test';

import { validateIssueBody } from '../../packages/repo-standards/scripts/commit-convention.mjs';
import {
  knownLabels,
  renderIssueBody,
  unknownLabels,
} from './plan-issues-render.mjs';

const record = (overrides = {}) => ({
  id: 'P-01',
  title: 'docs: an issue',
  note: '',
  kind: 'issue',
  labels: [],
  milestone: 'M1 - Foundation',
  dependencies: {
    blocking: [],
    blockedBy: [],
    parent: undefined,
    children: [],
  },
  sections: {
    problem: 'It is broken.',
    objective: 'Make it work.',
    context: 'Some background.',
    reproduction: '',
    scope: 'In: the fix.',
    acceptance: '- [ ] Fixed',
    notes: '',
    related: '',
  },
  ...overrides,
});

const epic = () =>
  record({
    id: 'E-1',
    kind: 'epic',
    dependencies: {
      blocking: [],
      blockedBy: [],
      parent: undefined,
      children: ['P-01', 'P-02'],
    },
    sections: {
      problem: 'The area is weak.',
      objective: '',
      context: '',
      reproduction: '',
      scope: '',
      acceptance: '',
      notes: '',
      related: '',
    },
  });

describe('renderIssueBody', () => {
  it('produces a body the issue gate accepts', () => {
    expect(validateIssueBody(renderIssueBody(record())).errors).toEqual([]);
  });

  it('produces an accepted body for an epic, whose sections are mostly absent', () => {
    expect(validateIssueBody(renderIssueBody(epic())).errors).toEqual([]);
  });

  it('marks a derived section so it is not mistaken for authored text', () => {
    expect(renderIssueBody(epic())).toContain('_Derived from the planning');
  });

  it('leaves an authored section exactly as written', () => {
    const body = renderIssueBody(record());
    expect(body).toContain('## 5. Scope Definition\n\nIn: the fix.');
    expect(body).not.toMatch(/Scope Definition\n\n[\s\S]*?_Derived/);
  });

  it('names the children in an epic objective and scope', () => {
    const body = renderIssueBody(epic());
    expect(body).toContain('P-01, P-02');
  });

  it('names the planning document it was actually given', () => {
    expect(
      renderIssueBody(record(), '.tmp/planning/2026-07-server.md'),
    ).toContain('Planned as `P-01` in `.tmp/planning/2026-07-server.md`.');
  });

  it('falls back to a description rather than a path when given none', () => {
    expect(renderIssueBody(record())).toContain(
      'Planned as `P-01` in `the planning document`.',
    );
  });

  it('says "not a bug" unless the entry is labelled one', () => {
    expect(renderIssueBody(record())).toContain(
      '## 4. Reproduction Steps\n\nNot a bug.',
    );
    expect(renderIssueBody(record({ labels: ['type: bug'] }))).toContain(
      'steps were not recorded in the plan',
    );
  });

  it('keeps the heading spelling the gate matches', () => {
    for (const heading of [
      '## 1. Problem Statement',
      '## 2. Objective',
      '## 3. Context & Background',
      '## 5. Scope Definition',
      '## 6. Acceptance Criteria',
    ]) {
      expect(renderIssueBody(record())).toContain(heading);
    }
  });

  it('emits the dependency block the convention requires', () => {
    const body = renderIssueBody(
      record({
        dependencies: {
          blocking: ['P-02'],
          blockedBy: [],
          parent: 'E-1',
          children: [],
        },
      }),
    );
    expect(body).toContain('blocking: [P-02]');
    expect(body).toContain('parent: E-1');
  });

  it('surfaces a heading note rather than dropping it', () => {
    expect(renderIssueBody(record({ note: '(optional)' }))).toContain(
      '**Note:** (optional)',
    );
  });
});

describe('label narrowing', () => {
  const allowed = ['type: docs', 'pkg: server'];

  it('keeps only labels the taxonomy defines', () => {
    expect(
      knownLabels(['type: docs', 'pkg: @lcabrera/server'], allowed),
    ).toEqual(['type: docs']);
  });

  it('reports the ones it dropped, so they are fixed not silently lost', () => {
    expect(
      unknownLabels(['type: docs', 'pkg: @lcabrera/server'], allowed),
    ).toEqual(['pkg: @lcabrera/server']);
  });
});
