import type { ColumnPinningState } from '@/components/Table/Table.types';
import type { UnpinConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';
import type { PinSide } from '@/types/ui.types';

import type { ResolveToggleColumnPinUpdateResult } from './resolveToggleColumnPinUpdate.util';

type ApplyToggleColumnPinResolutionArgs = {
  readonly acceptPinSide: (side: PinSide) => void;
  readonly acceptUnpinConflict: (resolution: UnpinConflictResolution) => void;
  readonly resolution: ResolveToggleColumnPinUpdateResult;
  readonly setColumnPinning: (
    nextPinning: ColumnPinningState<Record<string, unknown>>,
  ) => void;
  readonly setPinSideModal: (modal: {
    readonly columnKey: string;
    readonly columnLabel: string;
    readonly isOpen: boolean;
  }) => void;
  readonly setUnpinConflictModal: (modal: {
    readonly columnKey: string;
    readonly columnLabel: string;
    readonly isOpen: boolean;
    readonly side: 'left' | 'right';
  }) => void;
};

export const applyToggleColumnPinResolution = ({
  acceptPinSide,
  acceptUnpinConflict,
  resolution,
  setColumnPinning,
  setPinSideModal,
  setUnpinConflictModal,
}: ApplyToggleColumnPinResolutionArgs): void => {
  switch (resolution.kind) {
    case 'apply-pinning-direct': {
      setColumnPinning(resolution.nextPinning);
      return;
    }

    case 'auto-accept-pin-side': {
      setPinSideModal(resolution.modal);
      acceptPinSide(resolution.pinSide);
      return;
    }

    case 'auto-accept-unpin-conflict': {
      setUnpinConflictModal(resolution.modal);
      acceptUnpinConflict(resolution.resolution);
      return;
    }

    case 'ignored-static': {
      return;
    }

    case 'open-pin-side-modal': {
      setPinSideModal(resolution.modal);
      return;
    }

    case 'open-unpin-conflict-modal': {
      setUnpinConflictModal(resolution.modal);
      return;
    }
  }
};
