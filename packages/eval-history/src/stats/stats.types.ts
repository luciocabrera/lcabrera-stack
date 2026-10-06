import type { z } from 'zod';

import type { OUTCOMES } from '../envelope/envelope.constants.ts';
import type { regressionConfigSchema } from './regressionConfig.schema.ts';

export type HashSet = Readonly<Record<string, null | string>>;

export type Outcome = (typeof OUTCOMES)[number];

export type Rate =
  | { readonly k: number; readonly kind: 'insufficient'; readonly n: number }
  | {
      readonly k: number;
      readonly kind: 'rate';
      readonly lower: number;
      readonly n: number;
      readonly rate: number;
      readonly upper: number;
    };

export type RegressionConfig = z.output<typeof regressionConfigSchema>;

export type RegressionFinding =
  | {
      readonly failed: number;
      readonly kind: 'flip';
      readonly taskKey: string;
      readonly trials: number;
    }
  | {
      readonly kind: 'mean';
      readonly mean: number;
      readonly threshold: number;
    }
  | {
      readonly kind: 'rate';
      readonly main: Rate;
      readonly pr: Rate;
    };

export type RunIdentity = {
  readonly harnessVersion: string;
  readonly modelId: null | string;
};

export type TaskRunOutcomes = {
  readonly runs: readonly (readonly Outcome[])[];
  readonly taskKey: string;
};

export type TaskTrials = {
  readonly outcomes: readonly Outcome[];
  readonly set: 'capability' | 'regression';
  readonly taskKey: string;
};

export type TriggerTrial = {
  readonly expected: readonly string[];
  readonly invoked: readonly string[];
  readonly outcome: Outcome;
};
