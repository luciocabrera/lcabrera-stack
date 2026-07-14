import { ActionButtons } from '@repo/ui/components/ActionButtons';
import {
  useGetFormCancelLabel,
  useGetFormId,
  useGetFormLeafFields,
  useGetFormMode,
  useGetFormSubmission,
  useGetFormSubmitLabel,
  useGetIsFormDirty,
} from '@repo/ui/components/Form/contexts/FormContext/selectors';
import * as stylex from '@stylexjs/stylex';
import { useFetcher, useNavigation } from 'react-router';

import type { FormFooterActionsProps } from './FormFooterActions.types';

import { styles } from './FormFooterActions.stylex';

/**
 * Action-row delegate for FormBodyFooter.
 */
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
      color: 'primary',
      isDisabled: isSubmitDisabled,
      label: submitLabel,
      type: 'submit',
    },
    {
      color: 'outline',
      label: cancelLabel,
      onClick: handleCancelAction,
    },
  ] as const;

  return (
    <div {...stylex.props(styles.footer)}>
      <ActionButtons actions={actions} isBusy={isSubmitting} />
      {children}
    </div>
  );
};
