import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { readJsonFiles } from '../envelope/readJsonFiles.service.ts';
import { judgeScores } from './judgeScores.util.ts';

const fixtures = await readJsonFiles({
  directory: fileURLToPath(new URL('../envelope/fixtures', import.meta.url)),
});
const quality = runEnvelopeSchema.parse(fixtures.get('skill-quality.json'));
const skills = runEnvelopeSchema.parse(fixtures.get('skills.json'));

describe('judgeScores', () => {
  it("reads the judge's overall score from each passed quality trial", () => {
    const [trial] = quality.trials;

    if (trial === undefined || trial.detail.schema !== 'quality/1') {
      throw new Error('the quality fixture lost its scored trial');
    }

    expect(
      judgeScores([
        trial,
        { ...trial, detail: { ...trial.detail, overall: 2 } },
        { ...trial, outcome: 'error' },
      ]),
    ).toEqual([trial.detail.overall, 2]);
  });

  it('reads nothing from a trial no judge scored', () => {
    expect(judgeScores(skills.trials)).toEqual([]);
  });
});
