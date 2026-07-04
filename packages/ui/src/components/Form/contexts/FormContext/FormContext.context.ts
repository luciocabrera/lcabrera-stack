import { createContext } from 'react';

import type { FormContextValue } from './FormContext.types';

export const FormContext = createContext<FormContextValue | undefined>(
  undefined,
);

FormContext.displayName = 'FormContext';
