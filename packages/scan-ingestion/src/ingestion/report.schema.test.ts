import { describe, expect, it } from 'vitest';

import { reportSchema, scanFindingSchema } from './report.schema.ts';

const minimalFinding = {
  confidence: 'high',
  finding_id: 'f1',
  fix: 'remove it',
  location_path: 'src/foo.ts',
  rule_id: 'no-unused-export',
  severity: 'HIGH',
  why: 'unused',
};

describe('scanFindingSchema', () => {
  it('accepts the minimal required fields', () => {
    const parsed = scanFindingSchema.parse(minimalFinding);

    expect(parsed.finding_id).toBe('f1');
  });

  it('defaults verification_steps, extra, finding_kind, and status when omitted — required because sp_ingest_scan_result bulk-inserts via jsonb_to_recordset, which does not apply column DEFAULTs for absent keys', () => {
    const parsed = scanFindingSchema.parse(minimalFinding);

    expect(parsed.verification_steps).toEqual([]);
    expect(parsed.extra).toEqual({});
    expect(parsed.finding_kind).toBe('single_location');
    expect(parsed.status).toBe('open');
  });

  it('rejects a severity outside the canonical scale', () => {
    expect(() =>
      scanFindingSchema.parse({ ...minimalFinding, severity: 'critical' }),
    ).toThrow();
  });

  it('rejects status "resolved" — Step 5 must map it to "done" before emitting report.json, not this schema', () => {
    expect(() =>
      scanFindingSchema.parse({ ...minimalFinding, status: 'resolved' }),
    ).toThrow();
  });

  it('accepts every documented status value', () => {
    for (const status of ['open', 'in-progress', 'done', 'deferred']) {
      expect(() =>
        scanFindingSchema.parse({ ...minimalFinding, status }),
      ).not.toThrow();
    }
  });

  it('lifts a bare string in a string-array field to a one-element array, preserving content verbatim — the LLM scanners emit this drift in the wild (Phase 3 final E2E)', () => {
    const parsed = scanFindingSchema.parse({
      ...minimalFinding,
      dependencies: 'land F-001 first, then restructure',
      related_findings: 'F-001, F-003',
      tags: 'complexity',
      verification_steps: 'run the suite',
    });

    expect(parsed.dependencies).toEqual(['land F-001 first, then restructure']);
    expect(parsed.related_findings).toEqual(['F-001, F-003']);
    expect(parsed.tags).toEqual(['complexity']);
    expect(parsed.verification_steps).toEqual(['run the suite']);
  });

  it('still accepts real arrays and nullish values in the lifted fields', () => {
    const parsed = scanFindingSchema.parse({
      ...minimalFinding,
      // eslint-disable-next-line unicorn/no-null
      dependencies: null,
      related_findings: ['F-001', 'F-003'],
    });

    expect(parsed.dependencies).toBeNull();
    expect(parsed.related_findings).toEqual(['F-001', 'F-003']);
  });

  it('still rejects non-string array members in the lifted fields', () => {
    expect(() =>
      scanFindingSchema.parse({ ...minimalFinding, tags: [42] }),
    ).toThrow();
  });
});

describe('reportSchema', () => {
  it('defaults severity counts to 0 and findings to an empty array', () => {
    const parsed = reportSchema.parse({
      generated_at: '2026-01-01T00:00:00Z',
      report_id: 'report-1',
    });

    expect(parsed.blocker_count).toBe(0);
    expect(parsed.findings).toEqual([]);
  });

  it('requires report_id and generated_at', () => {
    expect(() => reportSchema.parse({})).toThrow();
  });

  it('parses a full report with findings', () => {
    const parsed = reportSchema.parse({
      findings: [minimalFinding],
      generated_at: '2026-01-01T00:00:00Z',
      high_count: 1,
      report_id: 'report-1',
    });

    expect(parsed.findings).toHaveLength(1);
    expect(parsed.findings[0]?.verification_steps).toEqual([]);
  });
});
