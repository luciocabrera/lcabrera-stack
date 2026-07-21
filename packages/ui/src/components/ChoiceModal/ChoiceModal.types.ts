import type { RadioOption } from '@lcabrera/ui/components/RadioOptionGroup';
import type { ReactNode } from 'react';

/**
 * Props for {@link ChoiceModal}, the shared "pick one option, then accept or
 * cancel" modal. Generic over the resolution union `TValue` so the options and
 * the accept callback stay type-safe for each consumer.
 */
export type ChoiceModalProps<TValue extends string = string> = {
  /** Value the modal seeds with and resets to after accept or cancel. */
  readonly defaultValue: TValue;
  /** Prompt shown above the options; free-form so callers can interpolate. */
  readonly description: ReactNode;
  /** Controls modal visibility. */
  readonly isOpen: boolean;
  /** Called with the chosen value when Accept is clicked. */
  readonly onAccept: (value: TValue) => void;
  /** Called when Cancel is clicked or the dialog is closed. */
  readonly onCancel: () => void;
  /** Selectable resolution options. */
  readonly options: readonly RadioOption<TValue>[];
  /** Shared `name` attribute for the radio group inputs. */
  readonly radioName: string;
  /** Modal heading. */
  readonly title: string;
};
