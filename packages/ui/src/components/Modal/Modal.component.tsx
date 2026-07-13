import { AppBackground } from '@repo/ui/components/AppBackground';
import { AppDotted } from '@repo/ui/components/AppDotted';
import { Button } from '@repo/ui/components/Button';
import { MenuCloseIcon } from '@repo/ui/components/Icons';
import { Title } from '@repo/ui/components/Title';
import { ICON_SIZE_MD } from '@repo/ui/design-system/constants/iconSizes.constants';
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
    <dialog ref={dialogRef} {...stylex.props(modalStyles.dialog)}>
      <AppBackground>
        <AppDotted>
          {title && (
            <Title
              actions={
                <Button
                  aria-label='Close'
                  color='ghost'
                  icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
                  onClick={onClose}
                  size='mini'
                  width='auto'
                />
              }
            >
              {title}
            </Title>
          )}
          <div {...stylex.props(modalStyles.body)}>{children}</div>
          {footer && <div {...stylex.props(modalStyles.footer)}>{footer}</div>}
        </AppDotted>
      </AppBackground>
    </dialog>
  );
};
