import type { FallowNextStepInput } from './fallow.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

type ExtractFallowNextStepsArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_next_steps rows — fallow's own suggested next CLI commands
 * (top-level next_steps, e.g. `fallow dead-code --changed-workspaces
 * origin/main`). Previously absent from fallowRawSchema entirely, so these
 * were stripped before extraction ever saw them (only surviving in the
 * verbatim scans.raw_json archive).
 */
export const extractFallowNextSteps = ({
  raw,
}: ExtractFallowNextStepsArgs): readonly FallowNextStepInput[] =>
  raw.next_steps.map((step) => ({
    command: step.command ?? undefined,
    reason: step.reason ?? undefined,
    step_id: step.id ?? undefined,
  }));
