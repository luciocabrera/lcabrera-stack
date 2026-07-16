import type { FormProps } from '@repo/ui/components/Form/Form.types';

export type FormBodyProps = Pick<
  FormProps<Record<string, unknown>>,
  'action' | 'children' | 'method'
>;
