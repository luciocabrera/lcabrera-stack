import { use, useEffect } from 'react';

import type { TableCellCallOutcome } from '#ui/components/Table/cellRenderers/cellRenderers.types';

import { describeUnresolvedTableCellCall } from '#ui/components/Table/cellRenderers/describeUnresolvedTableCellCall.util';
import { logger } from '#ui/utils/logger';

import { TableCellRenderingContext } from './TableCellRenderingContext.context';

export const useWarnUnresolvedTableCellCalls = (
  outcomes: ReadonlyMap<string, TableCellCallOutcome>,
) => {
  const { warnOnce } = use(TableCellRenderingContext);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const warn = warnOnce ?? ((message: string) => logger.warn(message));

    for (const [columnKey, outcome] of outcomes) {
      const message = describeUnresolvedTableCellCall({ columnKey, outcome });

      if (message !== undefined) warn(message);
    }
  }, [outcomes, warnOnce]);
};
