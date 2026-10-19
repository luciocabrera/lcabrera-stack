import type { RetainCounts } from './retain.types.ts';

import { TRANSCRIPT_RETENTION_DAYS } from '../ingest/ingest.constants.ts';
import {
  KEPT_TRANSCRIPT_BRANCH,
  SNAPSHOTS_KEPT_PER_SUBJECT,
} from './retain.constants.ts';

export const retainSummary = ({ snapshots, transcripts }: RetainCounts) =>
  `evals:retain: pruned ${String(transcripts)} transcript pointer(s) older than ${String(TRANSCRIPT_RETENTION_DAYS)} days outside ${KEPT_TRANSCRIPT_BRANCH} and baseline runs; trimmed ${String(snapshots)} content snapshot(s) beyond the newest ${String(SNAPSHOTS_KEPT_PER_SUBJECT)} per subject`;
