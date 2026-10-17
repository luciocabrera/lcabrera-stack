import type { RunComparisonRow } from './EvalsCompare.types';

const HASH = 'a'.repeat(64);

export const comparisonRow = (
  overrides: Partial<RunComparisonRow>,
): RunComparisonRow => ({
  agentPromptHashA: undefined,
  agentPromptHashB: undefined,
  contentHashA: HASH,
  contentHashB: HASH,
  expectedHashA: undefined,
  expectedHashB: undefined,
  fixtureHashA: HASH,
  fixtureHashB: HASH,
  judgePromptHashA: undefined,
  judgePromptHashB: undefined,
  kA: 3,
  kB: 3,
  nA: 3,
  nB: 3,
  outcomesA: ['pass', 'pass', 'pass'],
  outcomesB: ['pass', 'pass', 'pass'],
  subjectKind: 'skill',
  subjectName: 'react-19',
  suite: 'skills',
  taskHashA: HASH,
  taskHashB: HASH,
  taskKey: 'skills/react-19/trigger-1',
  ...overrides,
});
