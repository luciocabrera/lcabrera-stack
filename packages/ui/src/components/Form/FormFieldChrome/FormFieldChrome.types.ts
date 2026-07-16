import type { ReactNode } from 'react';

export type FormFieldChromeProps = {
  readonly children: ReactNode;
  readonly description?: string;
  readonly error?: string;
  readonly fieldId: string;
  /** The wrapped input already renders its own visible label (e.g. ToggleSwitch) — skip the external label. */
  readonly hideLabel?: boolean;
  readonly isRequired?: boolean;
  readonly label: string;
};
