import { useTableContainerRef } from '@lcabrera/ui/components/Table/contexts/TableWrapper';
import { TableActionButton } from '@lcabrera/ui/components/Table/TableActionButton';
import * as stylex from '@stylexjs/stylex';
import { useId } from 'react';

import type { TableActionsPopoverProps } from './TableActionsPopover.types';

import { styles } from './TableActionsPopover.stylex';
import { useTableActionsPopoverPosition } from './useTableActionsPopoverPosition.hook';

export const TableActionsPopover = ({
  ariaLabel,
  children,
  customStylex,
  isDisabled = false,
  isEnabled = true,
  label,
}: TableActionsPopoverProps) => {
  const containerRef = useTableContainerRef();
  const menuId = useId().replaceAll(':', '');
  const triggerId = `${menuId}-trigger`;

  const {
    closeMenu,
    handlePopoverToggle,
    handleToggleMenu,
    isMenuOpen,
    menuPosition,
    menuRef,
  } = useTableActionsPopoverPosition({
    containerRef,
    isEnabled,
    triggerId,
  });

  return (
    <div {...stylex.props(styles.trigger, customStylex)}>
      <TableActionButton
        ariaLabel={ariaLabel}
        isDisabled={isDisabled}
        label={label}
        menuId={menuId}
        onClick={handleToggleMenu}
        triggerId={triggerId}
      />
      <div
        id={menuId}
        onToggle={handlePopoverToggle}
        popover='auto'
        ref={menuRef}
        {...stylex.props(
          styles.menu,
          menuPosition
            ? styles.menuPosition(menuPosition.left, menuPosition.top)
            : styles.menuHidden,
        )}
      >
        {Boolean(isMenuOpen) && children({ closeMenu })}
      </div>
    </div>
  );
};
