import type {
  ColumnAnalyticalRole,
  DistinctEstimate,
  GroupKeyRefusalReason,
} from './group-query-builder.types.ts';

import { MAX_GROUP_KEY_DISTINCT } from './group-key-bounds.constants.ts';
import { IDENTIFIER_TYPE_NAMES } from './identifier-types.constants.ts';
import { isUniqueIsh } from './is-unique-ish.util.ts';

type RefuseGroupKeyArgs = {
  readonly estimate: DistinctEstimate;
  readonly hasEquality: boolean;
  readonly relTuples: number;
  readonly role: ColumnAnalyticalRole;
  readonly typeName: string;
};

/**
 * The refusal rules in priority order, because a refused column gets exactly one
 * message and it should be the most useful one. Returns `undefined` when the
 * column may be a group key.
 *
 * The role check comes first on purpose: for a `point` column both the role and
 * the equality check fail, and "not a dimension" is a sentence a user
 * understands where "no equality operator for type point" is not. That ordering
 * also gives `no-equality-operator` its real job — it fires for a type whose
 * category says dimension or fact but which still resolves no operator, which is
 * exactly the extension or domain type the role gate cannot know about.
 */
export const refuseGroupKey = ({
  estimate,
  hasEquality,
  relTuples,
  role,
  typeName,
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
    (role === 'fact' || IDENTIFIER_TYPE_NAMES.has(typeName))
  ) {
    return 'stats-unavailable';
  }

  return estimate.kind === 'known' && estimate.value > MAX_GROUP_KEY_DISTINCT
    ? 'too-many-distinct'
    : undefined;
};
