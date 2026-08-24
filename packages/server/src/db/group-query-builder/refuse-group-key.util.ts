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

/**
 * Refusal rules run in priority order so a refused column gets the most useful message.
 * The role check comes first on purpose: for a `point` column both role and equality fail,
 * and "not a dimension" is the sentence a user understands. That ordering also gives
 * `no-equality-operator` its real job — it fires for a type whose category says dimension
 * or fact but which still resolves no operator, which is the extension or domain type the
 * role gate cannot know about.
 */
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

  // A fact is a measure, so it is only a legitimate key when the statistics show
  // it behaving like a dimension. With no statistics that is not demonstrable,
  // and guessing yes on an amount column is the expensive direction.
  //
  // An identifier type clears the same bar despite being a dimension (#599). The
  // ordinary dimension rule is warn-and-proceed, so that grouping is not dead on
  // a freshly restored database — benign for `text`, optimistic for `uuid`,
  // which is far more often a key than a label.
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
