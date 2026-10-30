import type {
  ADJUDICATION_VERDICTS,
  VERIFIER_ROLES,
} from '../envelope/envelope.constants.ts';
import type { GROUND_TRUTH_SOURCES } from './adjudications.constants.ts';

export type AccuracyRow = {
  readonly correct: number;
  readonly falseAlarms: number;
  readonly missedReal: number;
  readonly model: string;
  readonly verdicts: number;
  readonly verifierRole: VerifierRole;
};

export type AdjudicationVerdict = (typeof ADJUDICATION_VERDICTS)[number];

export type GroundTruth = {
  readonly caseId: string;
  readonly note: string | undefined;
  readonly source: GroundTruthSource;
  readonly truth: AdjudicationVerdict;
};

export type GroundTruthSource = (typeof GROUND_TRUTH_SOURCES)[number];

export type VerifierRole = (typeof VERIFIER_ROLES)[number];
