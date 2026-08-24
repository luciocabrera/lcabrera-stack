import { ChoiceModal } from '#ui/components/ChoiceModal';
import { PIN_SIDE_OPTIONS } from '#ui/constants/pinningPreferences.constants';

import type { PinSideModalProps } from './PinSideModal.types';

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
