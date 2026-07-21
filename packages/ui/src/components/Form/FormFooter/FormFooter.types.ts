import type { FormProps } from '@lcabrera/ui/components/Form/Form.types';

export type FormFooterProps = Pick<
  FormProps<Record<string, unknown>>,
  'children'
>;
