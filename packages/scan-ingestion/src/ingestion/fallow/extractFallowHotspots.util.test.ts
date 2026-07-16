import { describe, expect, it } from 'vitest';

import { extractFallowHotspots } from './extractFallowHotspots.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowHotspots', () => {
  it('maps health.hotspots to fallow_hotspots rows', () => {
    const raw = fallowRawSchema.parse({
      health: {
        hotspots: [
          {
            commits: 12,
            complexity_density: 0.25,
            fan_in: 1,
            lines_added: 170,
            lines_deleted: 139,
            path: 'apps/web/src/Orders.component.tsx',
            score: 66,
            trend: 'accelerating',
            weighted_commits: 9.65,
          },
        ],
      },
    });

    expect(extractFallowHotspots({ raw })).toEqual([
      {
        commits: 12,
        complexity_density: 0.25,
        fan_in: 1,
        file_path: 'apps/web/src/Orders.component.tsx',
        lines_added: 170,
        lines_deleted: 139,
        score: 66,
        trend: 'accelerating',
        weighted_commits: 9.65,
      },
    ]);
  });

  it('returns [] when the health section is missing', () => {
    expect(extractFallowHotspots({ raw: fallowRawSchema.parse({}) })).toEqual(
      [],
    );
  });
});
