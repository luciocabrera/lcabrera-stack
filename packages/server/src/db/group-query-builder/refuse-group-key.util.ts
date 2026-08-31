import type {
  ColumnAnalyticalRole,
  DistinctEstimate,
  GroupKeyRefusalReason,
} from './group-query-builder.types.ts';

import { MAX_GROUP_KEY_DISTINCT } from './group-query-builder.constants.ts';
import { isIdentifierType } from './is-identifier-type.util.ts';
import { isUniqueIsh } from './is-unique-ish.util.ts';

type RefuseGroupKeyArgs = {
  readonly estimate: DistinctEstimate;
  readonly hasEquality: boolean;
  readonly relTuples: number;
  readonly role: ColumnAnalyticalRole;
  readonly typeName: string;
  readonly typeNamespace: string;
};

export const refuseGroupKey = ({
  estimate,
  hasEquality,
  relTuples,
  role,
  typeName,
  typeNamespace,
}: RefuseGroupKeyArgs): GroupKeyRefusalReason | undefined => {
  if (role === 'unsupported') {
    return 'not-a-dimension';
  }

  if (!hasEquality || estimate.kind === 'undefinedDistinctness') {
    return 'no-equality-operator';
  }

  if (isUniqueIsh({ estimate, relTuples })) {
    return 'unique-ish';
  }

  if (
    estimate.kind === 'unknown' &&
    (role === 'fact' || isIdentifierType({ typeName, typeNamespace }))
  ) {
    return 'stats-unavailable';
  }

  return estimate.kind === 'known' && estimate.value > MAX_GROUP_KEY_DISTINCT
    ? 'too-many-distinct'
    : undefined;
};
