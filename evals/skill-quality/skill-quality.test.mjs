import { describe, expect, it } from 'vite-plus/test';

import {
  baselineTable,
  judgePrompt,
  parseJudgement,
  RUBRIC,
  selectedSkills,
} from './skill-quality.mjs';

const reply = (scores, extra = {}) =>
  JSON.stringify({
    dimensions: RUBRIC.map(({ name }, index) => ({
      feedback: `${name} note`,
      name,
      score: scores[index],
    })),
    overall_score: 5,
    summary: 'fine',
    ...extra,
  });

describe('judgePrompt', () => {
  it('names every dimension and carries the skill between fences', () => {
    const prompt = judgePrompt('# Demo skill');
    for (const { name } of RUBRIC) {
      expect(prompt).toContain(`- **${name}**:`);
    }
    expect(prompt.endsWith('---\n# Demo skill\n---')).toBe(true);
  });
});

describe('parseJudgement', () => {
  it('averages the dimension scores itself rather than trusting overall_score', () => {
    const { judgement, problems } = parseJudgement(reply([4, 3, 2, 5, 1]));
    expect(problems).toEqual([]);
    expect(judgement?.overall).toBe(3);
    expect(judgement?.dimensions.map(({ name }) => name)).toEqual(
      RUBRIC.map(({ name }) => name),
    );
  });

  it('reads a reply wrapped in a json fence', () => {
    const fenced = `Here it is:\n\`\`\`json\n${reply([5, 5, 5, 5, 5])}\n\`\`\``;
    expect(parseJudgement(fenced).judgement?.overall).toBe(5);
  });

  it.each([
    [
      'prose',
      'The skill is good.',
      'the reply is not the JSON object the prompt asks for',
    ],
    [
      'an empty reply',
      '',
      'the reply is not the JSON object the prompt asks for',
    ],
    [
      'a missing dimension',
      JSON.stringify({ dimensions: [{ name: 'clarity', score: 4 }] }),
      'the reply has no "completeness" dimension',
    ],
    [
      'a score of 0',
      reply([0, 3, 3, 3, 3]),
      'the "clarity" score is not a whole number from 1 to 5',
    ],
    [
      'a score of 6',
      reply([3, 6, 3, 3, 3]),
      'the "completeness" score is not a whole number from 1 to 5',
    ],
    [
      'a fractional score',
      reply([3, 3, 3.5, 3, 3]),
      'the "trigger_precision" score is not a whole number from 1 to 5',
    ],
    [
      'a string score',
      reply([3, 3, 3, '4', 3]),
      'the "scope_coverage" score is not a whole number from 1 to 5',
    ],
  ])('refuses %s', (_label, text, problem) => {
    const { judgement, problems } = parseJudgement(text);
    expect(judgement).toBeUndefined();
    expect(problems).toContain(problem);
  });
});

describe('selectedSkills', () => {
  it('returns the whole catalog when no name is given', () => {
    expect(selectedSkills({ catalog: ['a', 'b'], requested: [] })).toEqual([
      'a',
      'b',
    ]);
  });

  it('refuses a name that is no skill, so a typo cannot pass as an empty run', () => {
    expect(() =>
      selectedSkills({ catalog: ['a'], requested: ['a', 'typo'] }),
    ).toThrow('"typo" is no skill in .github/skills/');
  });
});

describe('baselineTable', () => {
  it('prints a judged skill with its scores and a failed one with its error', () => {
    const { judgement } = parseJudgement(reply([4, 4, 3, 4, 4]));
    expect(
      baselineTable([
        { judgement, skill: 'demo' },
        { error: 'the session ended with error_max_turns', skill: 'broken' },
      ]).split('\n'),
    ).toEqual([
      '| skill | clarity | completeness | trigger_precision | scope_coverage | anti_patterns | overall |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| demo | 4 | 4 | 3 | 4 | 4 | 3.8 |',
      '| broken | — | — | — | — | — | not judged: the session ended with error_max_turns |',
    ]);
  });
});
