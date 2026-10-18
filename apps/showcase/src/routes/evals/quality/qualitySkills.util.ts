import type { readQualityBaselines } from '@repo/eval-history/queries/readQualityBaselines.service';
import type { readQualityScores } from '@repo/eval-history/queries/readQualityScores.service';

import type { RunFigures } from '../types/runFigures.types';

import { evalsHref } from '../utils/evalsHref.util';
import { dimensionBand } from './dimensionBand.util';

type QualityBaseline = Awaited<ReturnType<typeof readQualityBaselines>>[number];

type QualityScore = Awaited<ReturnType<typeof readQualityScores>>[number];

type QualitySkillsArgs = {
  readonly baselines: readonly QualityBaseline[];
  readonly runs: readonly RunFigures[];
  readonly scores: readonly QualityScore[];
};

type ToneArgs = {
  readonly band: ReturnType<typeof dimensionBand>;
  readonly value: number;
};

const toneOf = ({ band, value }: ToneArgs) => {
  if (band === undefined) {
    return 'neutral' as const;
  }

  return value < band.lower ? ('error' as const) : ('success' as const);
};

export const qualitySkills = ({
  baselines,
  runs,
  scores,
}: QualitySkillsArgs) => {
  const oldestFirst = runs.toReversed();
  const recentIds = new Set(runs.map(({ runId }) => runId));
  const subjects = new Map(
    [...scores.filter(({ runId }) => recentIds.has(runId)), ...baselines].map(
      ({ subjectKind, subjectName }) => [
        `${subjectKind}/${subjectName}`,
        { kind: subjectKind, name: subjectName },
      ],
    ),
  )
    .values()
    .toArray()
    .toSorted((left, right) => left.name.localeCompare(right.name));

  return subjects.map(({ kind, name }) => {
    const mine = scores.filter(
      (score) => score.subjectKind === kind && score.subjectName === name,
    );
    const baseline = baselines.find(
      (candidate) =>
        candidate.subjectKind === kind && candidate.subjectName === name,
    );
    const baselineRuns = new Set(baseline?.runIds);
    const dimensions = [
      ...new Set(mine.map(({ dimension }) => dimension)),
    ].toSorted((left, right) => left.localeCompare(right));

    return {
      baseline:
        baseline === undefined
          ? undefined
          : { modelId: baseline.modelId, runs: baseline.runIds.length },
      dimensions: dimensions.map((dimension) => {
        const ofDimension = mine.filter(
          (score) => score.dimension === dimension,
        );
        const band = dimensionBand(
          ofDimension
            .filter(({ runId }) => baselineRuns.has(runId))
            .map(({ mean }) => mean),
        );
        const points = oldestFirst
          .map((run) => ({
            run,
            score: ofDimension.find(({ runId }) => runId === run.runId),
          }))
          .filter(
            (
              entry,
            ): entry is {
              readonly run: RunFigures;
              readonly score: QualityScore;
            } => entry.score !== undefined,
          )
          .map(({ run, score }) => ({
            href: evalsHref({ runId: run.runId }),
            key: run.runId,
            label: `Run ${run.runId.slice(0, 8)}, ${run.startedAt.slice(0, 10)}: ${score.mean.toFixed(2)} over ${String(score.trials)} trials`,
            tone: toneOf({ band, value: score.mean }),
            value: score.mean,
          }));

        return { band, dimension, latest: points.at(-1), points };
      }),
      kind,
      name,
    };
  });
};
