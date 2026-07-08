import { use } from 'react';

import type { RenderFieldsFn } from './FormFieldsRendererContext.types';

import { FormFieldsRendererContext } from './FormFieldsRendererContext.context';

export const useFormFieldsRendererContext = (): RenderFieldsFn => {
  const context = use(FormFieldsRendererContext);

  if (context === undefined) {
    throw new Error(
      'useFormFieldsRendererContext must be used within FormFields',
    );
  }

  return context;
};
