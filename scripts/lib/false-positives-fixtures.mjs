/**
 * The case, entry, envelope and marker the false-positive gate tests build
 * on, and a check that validates each envelope through the real schema, so
 * every test reads the same passing shape before it plants one failure.
 */
import { toCurrentAdjudication } from '@repo/eval-history/envelope/toCurrentAdjudication.util';

import {
  findClaimedMarkers,
  hashLines,
  markerSpelling,
} from './false-positive-markers.mjs';
import { checkFalsePositives } from './false-positives.mjs';

export const FILE = 'packages/x/src/query.util.ts';
export const CASE = 'FP-0007';
export const FLAGGED = [
  'export const query = (table) => "select * from " + table;',
];
const HASH = hashLines(FLAGGED);
export const TODAY = '2026-10-30';

export const marker = (overrides = {}) =>
  markerSpelling({
    analyzer: 'fallow',
    caseId: CASE,
    reason: 'the identifier comes from a fixed allow-list',
    rule: 'security/sql-concat',
    ...overrides,
  });

export const source = (line = marker(), flagged = FLAGGED) =>
  [line, ...flagged].join('\n');

export const verifier = (model, role, verdict = 'FALSE_POSITIVE') => ({
  agent_prompt_hash: 'a'.repeat(64),
  cost_usd: null,
  duration_ms: 1,
  evidence: 'Ran the trace and found no path from input to the identifier.',
  model,
  role,
  tokens_in: 1,
  tokens_out: 1,
  verdict,
});

export const envelope = (overrides = {}) => ({
  case: {
    analyzer: 'fallow',
    base_sha: '1'.repeat(40),
    case_id: CASE,
    content_hash: HASH,
    created_at: '2026-10-29T10:00:00.000Z',
    file: FILE,
    finding_id: `${FILE}:2:security/sql-concat`,
    head_sha: '2'.repeat(40),
    pr: null,
    rule: 'security/sql-concat',
  },
  outcome: 'dismissed',
  schema_version: 1,
  verifiers: [
    verifier('claude-opus-5-5', 'judge'),
    verifier('claude-sonnet-5', 'judge'),
    verifier('claude-fable-1', 'adversary'),
  ],
  ...overrides,
});

export const ENTRY = {
  analyzer: 'fallow',
  case: CASE,
  contentHash: HASH,
  evidence: `docs/agents/adjudications/${CASE}.json`,
  expires: '2027-04-29',
  file: FILE,
  lines: 1,
  rule: 'security/sql-concat',
};

export const check = ({
  cases = { [ENTRY.evidence]: envelope() },
  entries = [ENTRY],
  file = FILE,
  text = source(),
  today = TODAY,
} = {}) =>
  checkFalsePositives({
    entries,
    markers: findClaimedMarkers({ file, text }),
    readCase: (path) =>
      path in cases
        ? toCurrentAdjudication({ input: cases[path] })
        : { missing: true },
    readText: () => text,
    today,
  });
