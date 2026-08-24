import * as stylex from '@stylexjs/stylex';
import { useFetcher, useNavigation } from 'react-router';

import type { ActionButtonDescriptor } from '#ui/components/ActionButtons';

import { ActionButtons } from '#ui/components/ActionButtons';
import {
  useGetFormCancelLabel,
  useGetFormId,
  useGetFormLeafFields,
  useGetFormMode,
  useGetFormSubmission,
  useGetFormSubmitLabel,
  useGetIsFormDirty,
} from '#ui/components/Form/contexts/FormContext/selectors';

import type { FormFooterActionsProps } from './FormFooterActions.types';

import { styles } from './FormFooterActions.stylex';

export const FormFooterActions = ({
  children,
  onCancelClick,
}: FormFooterActionsProps) => {
  const mode = useGetFormMode();
  const formId = useGetFormId();
  const submission = useGetFormSubmission();
  const cancelLabel = useGetFormCancelLabel();
  const submitLabel = useGetFormSubmitLabel();
  const leafFields = useGetFormLeafFields();
  const isDirty = useGetIsFormDirty(leafFields.map((field) => field.accessor));
  const navigation = useNavigation();
  const fetcher = useFetcher({ key: formId });

  if (mode === 'view') {
    return;
  }

  const isSubmitting =
    submission === 'fetcher'
      ? fetcher.state !== 'idle'
      : navigation.state === 'submitting' &&
        navigation.formData?.get('formId') === formId;

  const isSubmitDisabled = isSubmitting || (mode === 'edit' && !isDirty);

  const handleCancelAction = () => {
    onCancelClick(isDirty);
  };

  const actions = [
    {
      isDisabled: isSubmitDisabled,
      label: submitLabel,
      type: 'submit',
      variant: 'primary',
    },
    {
      label: cancelLabel,
      onClick: handleCancelAction,
      variant: 'outline',
    },
  ] as const satisfies readonly ActionButtonDescriptor[];

  return (
    <div {...stylex.props(styles.footer)}>
      <ActionButtons actions={actions} isBusy={isSubmitting} />
      {children}
    </div>
  );
};
