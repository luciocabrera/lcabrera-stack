import type { ReactNode } from 'react';

import type { RadioOption } from '#ui/components/RadioOptionGroup';

export type ChoiceModalProps<TValue extends string = string> = {
  readonly defaultValue: TValue;
  readonly description: ReactNode;
  readonly isOpen: boolean;
  readonly onAccept: (value: TValue) => void;
  readonly onCancel: () => void;
  readonly options: readonly RadioOption<TValue>[];
  readonly radioName: string;
  readonly title: string;
};
