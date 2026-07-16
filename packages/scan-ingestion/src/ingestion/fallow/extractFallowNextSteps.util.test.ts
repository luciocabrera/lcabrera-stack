import { describe, expect, it } from 'vitest';

import { extractFallowNextSteps } from './extractFallowNextSteps.util.ts';
import { fallowRawSchema } from './fallowRaw.schema.ts';

describe('extractFallowNextSteps', () => {
  it('maps top-level next_steps into rows', () => {
    const raw = fallowRawSchema.parse({
      next_steps: [
        {
          command: 'fallow dead-code --changed-workspaces origin/main',
          id: 'scope-workspaces',
          reason: 'scope a monorepo run to the packages your branch touched',
        },
        {
          command: 'fallow health --complexity-breakdown',
          id: 'complexity-breakdown',
          reason: 'see per-decision-point contributions for a hotspot',
        },
      ],
    });

    expect(extractFallowNextSteps({ raw })).toEqual([
      {
        command: 'fallow dead-code --changed-workspaces origin/main',
        reason: 'scope a monorepo run to the packages your branch touched',
        step_id: 'scope-workspaces',
      },
      {
        command: 'fallow health --complexity-breakdown',
        reason: 'see per-decision-point contributions for a hotspot',
        step_id: 'complexity-breakdown',
      },
    ]);
  });

  it('returns [] when next_steps is absent', () => {
    expect(extractFallowNextSteps({ raw: fallowRawSchema.parse({}) })).toEqual(
      [],
    );
  });
});
