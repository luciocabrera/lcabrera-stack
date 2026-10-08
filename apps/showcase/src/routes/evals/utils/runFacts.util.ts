import type { RunFigures } from '../types/runFigures.types';

import { costLabel } from './costLabel.util';
import { durationLabel } from './durationLabel.util';
import { intervalLabel } from './intervalLabel.util';
import { passRateLabel } from './passRateLabel.util';

const UNKNOWN = 'unknown';

export const runFacts = (run: RunFigures) => {
  const platform = [run.os, run.arch].filter((part) => part !== undefined);

  return [
    { term: 'Suite', value: run.suite },
    { term: 'Pass rate', value: passRateLabel(run) },
    { term: 'Interval', value: intervalLabel(run) },
    { term: 'Cost', value: costLabel(run.costUsd) },
    { term: 'Duration', value: durationLabel(run.durationMs) },
    { term: 'Status', value: run.status },
    { term: 'Trigger', value: run.trigger },
    { term: 'Branch', value: run.branch },
    { term: 'Commit', value: run.gitSha.slice(0, 12) },
    { term: 'Started', value: run.startedAt.slice(0, 19).replace('T', ' ') },
    { term: 'Model', value: run.modelId ?? 'none' },
    { term: 'Harness', value: run.harnessVersion },
    {
      term: 'Runs per task',
      value: run.runs === undefined ? UNKNOWN : String(run.runs),
    },
    { term: 'Node', value: run.node ?? UNKNOWN },
    { term: 'OS', value: platform.length > 0 ? platform.join(' ') : UNKNOWN },
  ];
};
