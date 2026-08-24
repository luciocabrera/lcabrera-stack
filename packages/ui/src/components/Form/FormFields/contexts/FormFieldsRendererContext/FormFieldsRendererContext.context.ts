import { createContext } from 'react';

import type { RenderFieldsFn } from './FormFieldsRendererContext.types';

export const FormFieldsRendererContext = createContext<
  RenderFieldsFn | undefined
>(undefined);
