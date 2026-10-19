import { describe, expect, it } from 'vite-plus/test';

import {
  catalogMoved,
  changedSkills,
  OPT_IN_LABEL,
  parseLabels,
  runDecision,
  selectionOutputs,
  skillSelection,
  touchesEvalSurface,
} from './skill-scope.mjs';

const SKILL = (description) =>
  `---\nname: react-19\ndescription: ${description}\n---\nBody text.\n`;

describe('touchesEvalSurface', () => {
  it('reads skills, rules, agents and evals, and nothing else', () => {
    expect(touchesEvalSurface(['.claude/rules/scripts.md'])).toBe(true);
    expect(touchesEvalSurface(['.claude/agents/verifier.md'])).toBe(true);
    expect(touchesEvalSurface(['evals/README.md'])).toBe(true);
    expect(touchesEvalSurface(['.github/skills/epic/SKILL.md'])).toBe(true);
    expect(
      touchesEvalSurface(['.github/workflows/build.yml', 'docs/notes.md']),
    ).toBe(false);
  });
});

describe('changedSkills', () => {
  it('names each skill once, from its skill or its eval directory', () => {
    expect(
      changedSkills([
        'evals/skills/unslop/tasks/trigger-1.yaml',
        '.github/skills/react-19/SKILL.md',
        '.github/skills/react-19/references/hooks.md',
        'evals/skills/skill-triggers.mjs',
        '.claude/rules/scripts.md',
      ]),
    ).toStrictEqual(['react-19', 'unslop']);
  });
});

describe('catalogMoved', () => {
  it('ignores a body edit and sees a description edit', () => {
    expect(
      catalogMoved([
        { after: `${SKILL('Use it.')}More.\n`, before: SKILL('Use it.') },
      ]),
    ).toBe(false);
    expect(
      catalogMoved([
        { after: SKILL('Use it often.'), before: SKILL('Use it.') },
      ]),
    ).toBe(true);
  });

  it('counts a skill added or removed as a move', () => {
    expect(catalogMoved([{ after: SKILL('New.'), before: undefined }])).toBe(
      true,
    );
    expect(catalogMoved([{ after: undefined, before: SKILL('Old.') }])).toBe(
      true,
    );
  });
});

describe('skillSelection', () => {
  const runnable = ['react-19', 'unslop'];

  it('stays out of a PR that leaves the surface alone', () => {
    expect(
      skillSelection({ changed: ['README.md'], moved: false, runnable }),
    ).toStrictEqual({ scope: 'out', skills: [] });
  });

  it('runs every skill when a catalog entry moved', () => {
    expect(
      skillSelection({
        changed: ['.github/skills/react-19/SKILL.md'],
        moved: true,
        runnable,
      }),
    ).toStrictEqual({ scope: 'all', skills: [] });
  });

  it('runs only the changed skills that have trigger evals', () => {
    expect(
      skillSelection({
        changed: [
          '.github/skills/react-19/references/hooks.md',
          '.github/skills/retired/SKILL.md',
        ],
        moved: false,
        runnable,
      }),
    ).toStrictEqual({ scope: 'some', skills: ['react-19'] });
  });

  it('runs nothing for a rules-only change', () => {
    expect(
      skillSelection({
        changed: ['.claude/rules/scripts.md'],
        moved: false,
        runnable,
      }),
    ).toStrictEqual({ scope: 'none', skills: [] });
  });
});

describe('selectionOutputs', () => {
  it('writes one step-output line per key', () => {
    expect(
      selectionOutputs({
        labelled: true,
        run: true,
        scope: 'some',
        skills: ['react-19', 'unslop'],
      }),
    ).toStrictEqual([
      'scope=some',
      'skills=react-19 unslop',
      'labelled=true',
      'run=true',
    ]);
  });
});

describe('parseLabels', () => {
  it('reads the label names the workflow passes, and nothing else', () => {
    expect(parseLabels('["type: ci","evals"]')).toStrictEqual([
      'type: ci',
      'evals',
    ]);
    expect(parseLabels('[1,"evals"]')).toStrictEqual(['evals']);
    expect(parseLabels('{"name":"evals"}')).toStrictEqual([]);
    expect(parseLabels('not json')).toStrictEqual([]);
  });
});

describe('runDecision', () => {
  it.each([
    [['evals'], 'some', true],
    [['evals', 'type: ci'], 'all', true],
    [['evals'], 'none', false],
    [['evals'], 'out', false],
    [[], 'some', false],
    [['type: ci', 'Evals'], 'all', false],
  ])('labels %j with scope %s runs: %s', (labels, scope, run) => {
    expect(runDecision({ labels, scope })).toStrictEqual({
      labelled: labels.includes(OPT_IN_LABEL),
      run,
    });
  });
});
