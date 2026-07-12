import type { FormProps } from '@repo/ui/components/Form/Form.types';

export type FormBodyFooterProps = Pick<
  FormProps<Record<string, unknown>>,
  'children'
>;
