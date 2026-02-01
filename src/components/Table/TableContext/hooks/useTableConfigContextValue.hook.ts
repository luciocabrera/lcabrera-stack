import { use } from 'react';

import { TableConfigContext } from '../TableConfigContext.context';

export const useTableConfigContextValue = () => {
  const context = use(TableConfigContext);

  return context;
};
