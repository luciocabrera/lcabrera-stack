import { createTableRefusalReasonGuard } from './createTableRefusalReasonGuard.util';
import { TABLE_QUERY_REFUSAL_REASONS } from './refusal.constants';

export const isTableQueryRefusalReason = createTableRefusalReasonGuard(
  TABLE_QUERY_REFUSAL_REASONS,
);
