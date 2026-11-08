import { createContext } from 'react';

import { resolveTablePresentation } from '#ui/components/Table/utils/resolveTablePresentation.util';

export const TablePresentationContext = createContext(
  resolveTablePresentation({}),
);

TablePresentationContext.displayName = 'TablePresentationContext';
