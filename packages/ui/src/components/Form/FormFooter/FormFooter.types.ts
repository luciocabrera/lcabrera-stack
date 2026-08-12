import type { FormProps } from '#ui/components/Form/Form.types';

export type FormFooterProps = Pick<
  FormProps<Record<string, unknown>>,
  'children'
>;
