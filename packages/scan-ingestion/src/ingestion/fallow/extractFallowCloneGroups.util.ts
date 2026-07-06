import type { FallowRaw } from './fallowRaw.schema.ts';

import { type FallowCloneGroupInput } from './fallowDetail.types.ts';

type ExtractFallowCloneGroupsArgs = {
  readonly raw: FallowRaw;
};

/**
 * cqms.fallow_clone_groups (+ nested instances) inputs from
 * dupes.clone_groups. Array order is preserved — sp_ingest_fallow_detail
 * assigns group_index from it via WITH ORDINALITY, so the raw JSON order
 * stays reconstructible. clone_families are deliberately not stored: they
 * are groupings over the same groups, derivable by fingerprint/file.
 */
export const extractFallowCloneGroups = ({
  raw,
}: ExtractFallowCloneGroupsArgs): readonly FallowCloneGroupInput[] =>
  (raw.dupes?.clone_groups ?? []).map((group) => ({
    fingerprint: group.fingerprint ?? undefined,
    instances: group.instances.map((instance) => ({
      end_col: instance.end_col ?? undefined,
      end_line: instance.end_line ?? undefined,
      file_path: instance.file,
      fragment: instance.fragment ?? undefined,
      start_col: instance.start_col ?? undefined,
      start_line: instance.start_line ?? undefined,
    })),
    line_count: group.line_count ?? 0,
    suggested_name: group.suggested_name ?? undefined,
    token_count: group.token_count ?? 0,
  }));
