import { describe, expect, it } from 'vitest';

import { extractFallowFunctionFindings } from './extractFallowFunctionFindings.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowFunctionFindings', () => {
  it("maps health.findings keeping fallow's own severity scale", () => {
    const raw = fallowRawSchema.parse({
      health: {
        findings: [
          {
            cognitive: 19,
            col: 27,
            coverage_source: 'estimated',
            coverage_tier: 'none',
            crap: 702,
            cyclomatic: 26,
            exceeded: 'all',
            line: 193,
            line_count: 45,
            name: 'refreshAnalysisDoc',
            param_count: 1,
            path: 'scripts/report.cjs',
            severity: 'critical',
          },
        ],
      },
    });

    expect(extractFallowFunctionFindings({ raw })).toEqual([
      {
        cognitive: 19,
        col: 27,
        coverage_source: 'estimated',
        coverage_tier: 'none',
        crap: 702,
        cyclomatic: 26,
        exceeded: 'all',
        file_path: 'scripts/report.cjs',
        function_name: 'refreshAnalysisDoc',
        line: 193,
        line_count: 45,
        param_count: 1,
        severity: 'critical',
      },
    ]);
  });

  it('returns [] when the health section is missing', () => {
    expect(
      extractFallowFunctionFindings({ raw: fallowRawSchema.parse({}) }),
    ).toEqual([]);
  });
});
