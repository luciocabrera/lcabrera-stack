import type { FormProps } from '@repo/ui/components/Form/Form.types';

export type FormFooterProps = Pick<
  FormProps<Record<string, unknown>>,
  'children'
>;
