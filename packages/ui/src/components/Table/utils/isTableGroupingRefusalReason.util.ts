import { createTableRefusalReasonGuard } from './createTableRefusalReasonGuard.util';
import { TABLE_GROUPING_REFUSAL_REASONS } from './refusal.constants';

export const isTableGroupingRefusalReason = createTableRefusalReasonGuard(
  TABLE_GROUPING_REFUSAL_REASONS,
);
