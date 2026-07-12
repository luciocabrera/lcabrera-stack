import { use } from 'react';

import { FormFieldsRendererContext } from './FormFieldsRendererContext.context';

export const useFormFieldsRendererContext = () => {
  const context = use(FormFieldsRendererContext);

  if (context === undefined) {
    throw new Error(
      'useFormFieldsRendererContext must be used within FormFields',
    );
  }

  return context;
};
