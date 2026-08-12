import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import { AppBackground } from '#ui/components/AppBackground';
import { AppDotted } from '#ui/components/AppDotted';
import { Button } from '#ui/components/Button';
import { MenuCloseIcon } from '#ui/components/Icons';
import { Title } from '#ui/components/Title';
import { ICON_SIZE_MD } from '#ui/design-system/constants/iconSizes.constants';
import { surfaceStyles } from '#ui/design-system/tokens/surfaces.stylex';

import type { ModalProps } from './Modal.types';

import { modalStyles } from './Modal.stylex';

export const Modal = ({
  bodyStylex,
  children,
  customStylex,
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
      {...stylex.props(surfaceStyles.glass, modalStyles.dialog, customStylex)}
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
          <div {...stylex.props(modalStyles.body, bodyStylex)}>{children}</div>
          {Boolean(footer) && (
            <div {...stylex.props(modalStyles.footer)}>{footer}</div>
          )}
        </AppDotted>
      </AppBackground>
    </dialog>
  );
};
