import type { readRunHealth } from '@repo/eval-history/queries/readRunHealth.service';

import type { RunFigures } from '../types/runFigures.types';

import { evalsHref } from '../utils/evalsHref.util';
import { runWhenLabel } from '../utils/runWhenLabel.util';
import { RATE_LIMIT_CLASSES, UNCLASSIFIED } from './EvalsHealth.constants';

type HealthCount = Awaited<ReturnType<typeof readRunHealth>>[number];

type RunHealthArgs = {
  readonly counts: readonly HealthCount[];
  readonly runs: readonly RunFigures[];
};

const classId = ({ errorClass, outcome }: HealthCount) =>
  `${outcome}/${errorClass ?? UNCLASSIFIED}`;

const isRateLimit = ({ errorClass = '' }: Pick<HealthCount, 'errorClass'>) =>
  RATE_LIMIT_CLASSES.includes(errorClass);

const trialsIn = (counts: readonly HealthCount[]) =>
  counts.reduce((total, { trials }) => total + trials, 0);

const tally = (counts: readonly HealthCount[]) => ({
  errors: trialsIn(counts.filter(({ outcome }) => outcome === 'error')),
  rateLimits: trialsIn(counts.filter((count) => isRateLimit(count))),
  timeouts: trialsIn(counts.filter(({ outcome }) => outcome === 'timeout')),
});

const byClass = (counts: readonly HealthCount[]) =>
  [...new Set(counts.map((count) => classId(count)))]
    .map((id) => {
      const mine = counts.filter((count) => classId(count) === id);
      const [first] = mine;

      return {
        errorClass: first?.errorClass ?? UNCLASSIFIED,
        id,
        isRateLimit: first !== undefined && isRateLimit(first),
        outcome: first?.outcome ?? 'error',
        runs: new Set(mine.map(({ runId }) => runId)).size,
        trials: trialsIn(mine),
      };
    })
    .toSorted(
      (left, right) =>
        right.trials - left.trials || left.id.localeCompare(right.id),
    );

export const runHealth = ({ counts, runs }: RunHealthArgs) => {
  const suites = [...new Set(runs.map(({ suite }) => suite))];

  return suites.map((suite) => {
    const suiteRuns = runs.filter((run) => run.suite === suite);
    const runIds = new Set(suiteRuns.map(({ runId }) => runId));
    const suiteCounts = counts.filter(({ runId }) => runIds.has(runId));
    const perRun = suiteRuns.map((run) => ({
      href: evalsHref({ runId: run.runId }),
      label: runWhenLabel(run),
      runId: run.runId,
      trials: run.trials,
      ...tally(suiteCounts.filter(({ runId }) => runId === run.runId)),
    }));

    return {
      classes: byClass(suiteCounts),
      points: perRun
        .toReversed()
        .map(({ errors, href, label, runId, timeouts }) => ({
          href,
          key: runId,
          label: `${label}: ${String(errors)} errors, ${String(timeouts)} timeouts`,
          tone:
            errors + timeouts > 0 ? ('error' as const) : ('success' as const),
          value: errors + timeouts,
        })),
      runs: perRun.length,
      suite,
      totals: {
        ...tally(suiteCounts),
        trials: suiteRuns.reduce((total, { trials }) => total + trials, 0),
      },
      troubled: perRun.filter(({ errors, timeouts }) => errors + timeouts > 0),
    };
  });
};
