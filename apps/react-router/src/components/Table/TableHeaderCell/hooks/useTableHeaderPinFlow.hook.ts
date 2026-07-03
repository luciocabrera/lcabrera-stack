import { useState } from 'react';

import type { DataKey, PinnedColumnInfo } from '@/components/Table/Table.types';
import type { PinConflictResolution } from '@/components/Table/TableSettingsDrawer/ColumnOrderSection/ColumnOrderSection.types';
import type { PinConflictState, PinSide } from '@/types/ui.types';

import {
  useAcceptHeaderPinConflict,
  useAcceptHeaderPinSide,
  useSetColumnPinning,
} from '@/components/Table/contexts/TableConfig/columns/actions';
import {
  useGetGlobalPinConflictResolutionPreference,
  useGetGlobalPinSidePreference,
} from '@/contexts/GlobalSettingsContext/selectors';

const CLOSED_PIN_CONFLICT_STATE: PinConflictState = {
  isOpen: false,
  side: 'left',
};

export type UseTableHeaderPinFlowArgs<TData> = {
  readonly columnKey: DataKey<TData>;
  readonly pinInfo?: PinnedColumnInfo;
};

export const useTableHeaderPinFlow = <TData>({
  columnKey,
  pinInfo,
}: UseTableHeaderPinFlowArgs<TData>) => {
  const setColumnPinning = useSetColumnPinning<TData>();
  const acceptHeaderPinSide = useAcceptHeaderPinSide<TData>();
  const acceptHeaderPinConflict = useAcceptHeaderPinConflict<TData>();
  const globalPinConflictResolutionPreference =
    useGetGlobalPinConflictResolutionPreference();
  const globalPinSidePreference = useGetGlobalPinSidePreference();

  const [isPinSideModalOpen, setIsPinSideModalOpen] = useState(false);
  const [pinConflict, setPinConflict] = useState<PinConflictState>(
    CLOSED_PIN_CONFLICT_STATE,
  );

  const resolveConflict = ({
    conflict,
    fallbackSide,
  }: {
    readonly conflict: PinConflictState;
    readonly fallbackSide: 'left' | 'right';
  }) => {
    if (globalPinConflictResolutionPreference) {
      acceptHeaderPinConflict({
        columnKey,
        resolution: globalPinConflictResolutionPreference,
        side: conflict.side ?? fallbackSide,
      });
      return;
    }
    setPinConflict(conflict);
  };

  const handlePinSideAccept = (pinSide: PinSide) => {
    const conflict = acceptHeaderPinSide({ columnKey, pinSide });
    setIsPinSideModalOpen(false);

    if (!conflict) return;

    resolveConflict({ conflict, fallbackSide: 'left' });
  };

  const handlePinClick = () => {
    if (pinInfo?.side) {
      setColumnPinning({ columnKey, side: undefined });
      return;
    }

    if (globalPinSidePreference) {
      handlePinSideAccept(globalPinSidePreference);
      return;
    }

    setIsPinSideModalOpen(true);
  };

  const handlePinCancel = () => {
    setIsPinSideModalOpen(false);
  };

  const handlePinConflictAccept = (resolution: PinConflictResolution) => {
    acceptHeaderPinConflict({
      columnKey,
      resolution,
      side: pinConflict.side,
    });
    setPinConflict(CLOSED_PIN_CONFLICT_STATE);
  };

  const handlePinConflictCancel = () => {
    setPinConflict(CLOSED_PIN_CONFLICT_STATE);
  };

  return {
    handlePinCancel,
    handlePinClick,
    handlePinConflictAccept,
    handlePinConflictCancel,
    handlePinSideAccept,
    isPinSideModalOpen,
    pinConflict,
  };
};
