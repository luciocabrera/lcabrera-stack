import { AppBackground } from '@lcabrera/ui/components/AppBackground';
import { AppDotted } from '@lcabrera/ui/components/AppDotted';
import { Button } from '@lcabrera/ui/components/Button';
import { MenuCloseIcon } from '@lcabrera/ui/components/Icons';
import { Title } from '@lcabrera/ui/components/Title';
import { ICON_SIZE_MD } from '@lcabrera/ui/design-system/constants/iconSizes.constants';
import { surfaceStyles } from '@lcabrera/ui/design-system/tokens/surfaces.stylex';
import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import type { ModalProps } from './Modal.types';

import { modalStyles } from './Modal.stylex';

export const Modal = ({
  children,
  footer,
  isOpen,
  onClose,
  title,
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      {...stylex.props(surfaceStyles.glass, modalStyles.dialog)}
    >
      <AppBackground shouldFillViewport={false}>
        <AppDotted>
          {Boolean(title) && (
            <Title
              actions={
                <Button
                  aria-label='Close'
                  icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
                  onClick={onClose}
                  size='mini'
                  variant='ghost'
                />
              }
            >
              {title}
            </Title>
          )}
          <div {...stylex.props(modalStyles.body)}>{children}</div>
          {Boolean(footer) && (
            <div {...stylex.props(modalStyles.footer)}>{footer}</div>
          )}
        </AppDotted>
      </AppBackground>
    </dialog>
  );
};
