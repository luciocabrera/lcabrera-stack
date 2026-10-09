import { describe, expect, it } from 'vite-plus/test';

import { DETAIL_SCHEMA_BY_SUITE } from '../envelope/envelope.constants.ts';
import { runEnvelopeSchema } from '../envelope/envelope.schema.ts';
import { markedEnvelopes } from './markedEnvelopes.util.ts';

const MARKER = 'zz-marker';

const envelopes = markedEnvelopes({
  marker: MARKER,
  startedAt: '2026-10-05T00:00:00.000Z',
});

const quality = envelopes.find(({ run }) => run.suite === 'skill-quality');

describe('markedEnvelopes', () => {
  it('writes one valid envelope per suite, each with its own run id', () => {
    expect(envelopes.map(({ run }) => run.suite)).toEqual(
      Object.keys(DETAIL_SCHEMA_BY_SUITE),
    );
    expect(new Set(envelopes.map(({ run }) => run.run_id)).size).toBe(
      envelopes.length,
    );
    expect(
      envelopes.every(
        (envelope) => runEnvelopeSchema.safeParse(envelope).success,
      ),
    ).toBe(true);
  });

  it('puts the marker in the fields no public route may return', () => {
    const [rules] = envelopes;

    expect(rules?.run.actor).toBe(MARKER);
    expect(rules?.run.settings.argv).toEqual([MARKER]);
    expect(rules?.subjects[0]?.path).toBe(MARKER);
    expect(rules?.trials[0]?.transcript?.uri).toBe(MARKER);
    expect(JSON.stringify(quality?.trials[0]?.detail)).toContain(MARKER);
  });

  it('keeps the public fields free of the marker', () => {
    expect(quality?.run.branch).not.toBe(MARKER);
    expect(quality?.run.suite).toBe('skill-quality');
  });

  it('marks the judge model, which the allow-list names only as a column', () => {
    const detail = quality?.trials[0]?.detail;

    expect(detail?.schema === 'quality/1' && detail.judge_model).toBe(MARKER);
  });
});
