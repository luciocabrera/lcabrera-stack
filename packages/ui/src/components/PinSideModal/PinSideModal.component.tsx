import { ChoiceModal } from '@repo/ui/components/ChoiceModal';
import { PIN_SIDE_OPTIONS } from '@repo/ui/constants/pinningPreferences.constants';

import type { PinSideModalProps } from './PinSideModal.types';

/**
 * Confirmation modal for choosing which side to pin a table column to. A thin,
 * store-agnostic wrapper that configures the shared {@link ChoiceModal} with the
 * pin-side copy and options; consumers own the open state and callbacks.
 */
export const PinSideModal = ({
  columnLabel,
  isOpen,
  onAccept,
  onCancel,
}: PinSideModalProps) => (
  <ChoiceModal
    defaultValue='closest-edge'
    description={
      <>
        Choose which side to pin <strong>{columnLabel}</strong> to:
      </>
    }
    isOpen={isOpen}
    onAccept={onAccept}
    onCancel={onCancel}
    options={PIN_SIDE_OPTIONS}
    radioName='pin-side-selection'
    title='Pin Column'
  />
);
