import * as stylex from '@stylexjs/stylex';
import { useEffect } from 'react';

import type { SidePanelProps } from './SidePanel.types';

import { sidePanelStyles } from './SidePanel.stylex';

export const SidePanel = ({
  children,
  isOpen,
  onClose,
  position = 'right',
  showOverlay = true,
  size = 'md',
  ...props
}: SidePanelProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && onClose) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, isOpen, onClose]);

  return (
    <>
      {showOverlay && (
        <div
          data-testid="side-panel-overlay"
          onClick={handleOverlayClick}
          {...stylex.props(
            sidePanelStyles.overlay,
            isOpen ? sidePanelStyles.overlayVisible : sidePanelStyles.overlayHidden,
          )}
        />
      )}
      <div
        data-testid="side-panel"
        {...props}
        {...stylex.props(
          sidePanelStyles.base,
          sidePanelStyles.size[size],
          sidePanelStyles.position[position],
          isOpen
            ? sidePanelStyles.position[position === 'left' ? 'leftOpen' : 'rightOpen']
            : sidePanelStyles.position[position === 'left' ? 'leftClosed' : 'rightClosed'],
        )}
      >
        {children}
      </div>
    </>
  );
};
