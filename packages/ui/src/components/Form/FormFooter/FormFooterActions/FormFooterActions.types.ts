import type { FormFooterProps } from '../FormFooter.types';

export type FormFooterActionsProps = Pick<FormFooterProps, 'children'> & {
  readonly onCancelClick: (isDirty: boolean) => void;
};
