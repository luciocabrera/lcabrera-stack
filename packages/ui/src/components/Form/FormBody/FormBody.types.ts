import type { FormProps } from '@repo/ui/components/Form/Form.types';
import type { flattenFields } from '@repo/ui/components/Form/utils/flattenFields.util';

export type FormBodyProps<TValues extends Record<string, unknown>> = Omit<
  FormProps<TValues>,
  'initialValues' | 'mode' | 'serverErrors'
> & {
  readonly formId: string;
  readonly leafFields: ReturnType<typeof flattenFields<TValues>>;
};
