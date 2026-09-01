import type { GroupCardinalityWarning } from '@lcabrera/server/db/group-query-builder/group-query-builder.types';
import type { SerializableDbError } from '@lcabrera/server/errors/errors.types';
import type { TableGroupRow } from '@lcabrera/ui/components/Table/Table.types';

import type { WideAlltypes150 } from '@/services';

export type WideAlltypes150GroupRow = TableGroupRow & {
  readonly [K in keyof WideAlltypes150]?: never;
};

export type WideAlltypes150TableResponse = {
  readonly data: readonly WideAlltypes150TableRow[];
  readonly error?: SerializableDbError;
  readonly groupingWarning?: GroupCardinalityWarning;
  readonly hasMore: boolean;
  readonly total?: number;
};

export type WideAlltypes150TableRow =
  | (WideAlltypes150 & { readonly tableGroup?: never })
  | WideAlltypes150GroupRow;
