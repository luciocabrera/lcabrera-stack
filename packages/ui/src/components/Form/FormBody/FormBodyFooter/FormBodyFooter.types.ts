import type { FormProps } from '@repo/ui/components/Form/Form.types';
import type { flattenFields } from '@repo/ui/components/Form/utils/flattenFields.util';

export type FormBodyFooterProps<TValues extends Record<string, unknown>> = Pick<
  FormProps<TValues>,
  'cancelLabel' | 'cancelTo' | 'children' | 'submitLabel'
> & {
  /** Whether the owning form is currently submitting (fetcher/navigation state lives in the shell) */
  readonly isSubmitting: boolean;
  readonly leafFields: ReturnType<typeof flattenFields<TValues>>;
};
