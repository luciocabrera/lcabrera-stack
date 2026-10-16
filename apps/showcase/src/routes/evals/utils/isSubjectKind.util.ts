import { EVALS_SUBJECT_KINDS } from '../constants/evalsDashboard.constants';

const KINDS: readonly unknown[] = EVALS_SUBJECT_KINDS;

export const isSubjectKind = (
  value: unknown,
): value is (typeof EVALS_SUBJECT_KINDS)[number] => KINDS.includes(value);
