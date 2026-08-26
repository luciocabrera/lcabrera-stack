import type { FieldErrors } from '@lcabrera/ui/components/Form';
import type { FormMode } from '@lcabrera/ui/components/Form/Form.types';

import type { EnterpriseOrderValues } from '../config';

export type OrderFormModalProps = {
  readonly initialValues?: Partial<EnterpriseOrderValues>;
  readonly mode: FormMode;
  readonly serverErrors?: FieldErrors<EnterpriseOrderValues>;
  readonly submitLabel?: string;
  readonly title: string;
};
