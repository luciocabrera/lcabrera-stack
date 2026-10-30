import { createContext } from 'react';

import type { TableDensityDefaults } from '#ui/components/Table/Table.types';

export const TableDensityContext = createContext<TableDensityDefaults>({});

TableDensityContext.displayName = 'TableDensityContext';
