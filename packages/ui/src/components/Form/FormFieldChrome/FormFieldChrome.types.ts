import type { ReactNode } from 'react';

export type FormFieldChromeProps = {
  readonly children: ReactNode;
  readonly description?: string;
  readonly error?: string;
  readonly fieldId: string;
  readonly hideLabel?: boolean;
  readonly isRequired?: boolean;
  readonly label: string;
};
