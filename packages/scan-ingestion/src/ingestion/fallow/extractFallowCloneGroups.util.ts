import type { FallowCloneGroupInput } from './fallowDetail.types.ts';
import type { FallowRaw } from './fallowRaw.schema.ts';

import { makeFindingId } from '../../../../../.github/skills/code-smell-shared/scripts/deterministic-scan-shared.mjs';
import { buildCloneGroupFinding } from '../../../../../.github/skills/code-smell-shared/scripts/finding-templates.mjs';

type ExtractFallowCloneGroupsArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_clone_groups (+ nested instances) inputs from
 * dupes.clone_groups. Array order is preserved — sp_ingest_fallow_detail
 * assigns group_index from it via WITH ORDINALITY, so the raw JSON order
 * stays reconstructible. clone_families are deliberately not stored: they
 * are groupings over the same groups, derivable by fingerprint/file.
 *
 * rule_id/severity/why/fix/confidence/effort/finding_id plus location_path/
 * location_hint (ADR-028 — a group has no file_path/line of its own, so the
 * primary instance's location is denormalized here exactly like the
 * finding-templates builder computes it) come from the same builder the
 * .mjs report generator calls to build report.json's findings array.
 */
export const extractFallowCloneGroups = ({
  raw,
}: ExtractFallowCloneGroupsArgs): readonly FallowCloneGroupInput[] =>
  (raw.dupes?.clone_groups ?? []).map((group) => {
    const template = buildCloneGroupFinding(group);
    return {
      confidence: 'high',
      effort: template.effort,
      finding_id: makeFindingId(
        template.ruleId,
        template.locationPath,
        template.locationHint ?? '',
        template.why,
      ),
      fingerprint: group.fingerprint ?? undefined,
      fix: template.fix,
      instances: group.instances.map((instance) => ({
        end_col: instance.end_col ?? undefined,
        end_line: instance.end_line ?? undefined,
        file_path: instance.file,
        fragment: instance.fragment ?? undefined,
        start_col: instance.start_col ?? undefined,
        start_line: instance.start_line ?? undefined,
      })),
      line_count: group.line_count ?? 0,
      location_hint: template.locationHint,
      location_path: template.locationPath,
      rule_id: template.ruleId,
      severity: template.severity,
      suggested_name: group.suggested_name ?? undefined,
      token_count: group.token_count ?? 0,
      why: template.why,
    };
  });
