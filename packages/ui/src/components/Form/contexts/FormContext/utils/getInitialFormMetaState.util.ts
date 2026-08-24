import type {
  FieldNode,
  FormMode,
  FormSubmission,
  LeafFieldDef,
} from '#ui/components/Form/Form.types';

type GetInitialFormMetaStateArgs<TValues extends Record<string, unknown>> = {
  readonly cancelLabel?: string;
  readonly cancelTo: string;
  readonly fields: readonly FieldNode<TValues>[];
  readonly formId: string;
  readonly leafFields: readonly LeafFieldDef<TValues>[];
  readonly mode: FormMode;
  readonly submission?: FormSubmission;
  readonly submitLabel?: string;
};

export const getInitialFormMetaState = <
  TValues extends Record<string, unknown>,
>({
  cancelLabel = 'Cancel',
  cancelTo,
  fields,
  formId,
  leafFields,
  mode,
  submission = 'navigation',
  submitLabel = 'Accept',
}: GetInitialFormMetaStateArgs<TValues>) => {
  return {
    cancelLabel,
    cancelTo,
    fields,
    formId,
    leafFields,
    mode,
    submission,
    submitLabel,
  };
};
