import { describe, expect, it } from 'vite-plus/test';

import { extractFallowRunMetaMetrics } from './extractFallowRunMetaMetrics.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowRunMetaMetrics', () => {
  it('reads the run envelope, including the nested telemetry id', () => {
    const raw = fallowRawSchema.parse({
      _meta: { telemetry: { analysis_run_id: 'run-abc' } },
      elapsed_ms: 4200,
      kind: 'combined',
      schema_version: 7,
      version: '3.0.0',
    });

    expect(extractFallowRunMetaMetrics({ raw })).toEqual({
      analysis_run_id: 'run-abc',
      elapsed_ms: 4200,
      fallow_version: '3.0.0',
      raw_kind: 'combined',
      raw_schema_version: 7,
    });
  });

  it('leaves every field undefined for an empty run', () => {
    const raw = fallowRawSchema.parse({});

    expect(extractFallowRunMetaMetrics({ raw })).toEqual({
      analysis_run_id: undefined,
      elapsed_ms: undefined,
      fallow_version: undefined,
      raw_kind: undefined,
      raw_schema_version: undefined,
    });
  });

  it('converts an explicit null to undefined so the key is dropped', () => {
    // Nulls as they actually arrive — parsed from fallow.raw.json, which is
    // the only place they come from.
    const raw = fallowRawSchema.parse(
      JSON.parse('{"elapsed_ms":null,"version":null}'),
    );

    const metrics = extractFallowRunMetaMetrics({ raw });

    expect(metrics.elapsed_ms).toBeUndefined();
    expect(JSON.stringify(metrics)).not.toContain('elapsed_ms');
  });
});
