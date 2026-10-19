import { describe, expect, it } from 'vite-plus/test';

import { pruneTranscriptsQuery } from './pruneTranscriptsQuery.util.ts';

const query = pruneTranscriptsQuery({
  keptBranch: 'main',
  now: new Date('2026-10-18T00:00:00.000Z'),
  retentionDays: 90,
});

describe('pruneTranscriptsQuery', () => {
  it('binds the time, the retention and the kept branch in that order', () => {
    expect(query.values).toEqual(['2026-10-18T00:00:00.000Z', 90, 'main']);
  });

  it('clears every transcript column of a trial it prunes', () => {
    expect(query.text).toMatch(
      /set transcript_uri = null,\s+transcript_sha = null,\s+transcript_bytes = null,\s+transcript_expires_at = null/u,
    );
  });

  it('spares the kept branch and every baseline run', () => {
    expect(query.text).toContain('run.branch <> $3');
    expect(query.text).toContain("run.trigger <> 'baseline'");
    expect(query.text).toContain('run.baseline_id is null');
  });

  it('dates a pointer with no expiry from the run that wrote it', () => {
    expect(query.text).toContain(
      'run.finished_at + make_interval(days => $2::integer)',
    );
  });

  it('returns the number of trials it pruned', () => {
    expect(query.text).toMatch(
      /select count\(\*\)::integer as count from pruned$/u,
    );
  });
});
