import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { qualitySkills } from './qualitySkills.util';

const BASE_1 = '00000000-0000-4000-8000-000000000001';
const BASE_2 = '00000000-0000-4000-8000-000000000002';
const NEW = '00000000-0000-4000-8000-000000000003';

const run = (runId: string) =>
  ({ runId, startedAt: '2026-10-05T02:00:00.000Z' }) as RunFigures;

type ScoreArgs = {
  readonly dimension: string;
  readonly mean: number;
  readonly runId: string;
};

const score = ({ dimension, mean, runId }: ScoreArgs) => ({
  dimension,
  mean,
  runId,
  subjectKind: 'skill',
  subjectName: 'react-19',
  trials: 1,
});

describe('qualitySkills', () => {
  it("judges each dimension against the band of the skill's baseline runs", () => {
    const [skill] = qualitySkills({
      baselines: [
        {
          baselineId: '00000000-0000-4000-8000-0000000000ff',
          modelId: 'model-a',
          runIds: [BASE_1, BASE_2],
          subjectKind: 'skill',
          subjectName: 'react-19',
        },
      ],
      runs: [run(NEW), run(BASE_2)],
      scores: [
        score({ dimension: 'clarity', mean: 4, runId: BASE_1 }),
        score({ dimension: 'clarity', mean: 5, runId: BASE_2 }),
        score({ dimension: 'clarity', mean: 2, runId: NEW }),
        score({ dimension: 'accuracy', mean: 3, runId: NEW }),
      ],
    });

    expect(skill?.baseline).toEqual({ modelId: 'model-a', runs: 2 });
    expect(skill?.dimensions.map(({ dimension }) => dimension)).toEqual([
      'accuracy',
      'clarity',
    ]);
    expect(skill?.dimensions[0]).toMatchObject({ band: undefined });
    expect(skill?.dimensions[0]?.points[0]?.tone).toBe('neutral');

    const clarity = skill?.dimensions[1];

    expect(clarity?.band?.mean).toBe(4.5);
    expect(clarity?.points.map(({ key, tone }) => [key, tone])).toEqual([
      [BASE_2, 'success'],
      [NEW, 'error'],
    ]);
    expect(clarity?.latest?.value).toBe(2);
  });

  it('keeps a skill with a baseline and no recent run', () => {
    const skills = qualitySkills({
      baselines: [
        {
          baselineId: '00000000-0000-4000-8000-0000000000ff',
          modelId: 'model-a',
          runIds: [],
          subjectKind: 'skill',
          subjectName: 'epic',
        },
      ],
      runs: [],
      scores: [],
    });

    expect(skills).toEqual([
      {
        baseline: { modelId: 'model-a', runs: 0 },
        dimensions: [],
        kind: 'skill',
        name: 'epic',
      },
    ]);
  });
});
