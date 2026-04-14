import * as stylex from '@stylexjs/stylex';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { ICON_SIZE_MD } from '@/design-system/constants/iconSizes.constants';

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
      {...stylex.props(modalStyles.dialog, modalStyles.backdrop)}
    >
      {title && (
        <div {...stylex.props(modalStyles.header)}>
          <h2 {...stylex.props(modalStyles.title)}>{title}</h2>
          <Button
            aria-label='Close'
            color='ghost'
            icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
            onClick={onClose}
            size='mini'
            width='auto'
          />
        </div>
      )}
      <div {...stylex.props(modalStyles.body)}>{children}</div>
      {footer && <div {...stylex.props(modalStyles.footer)}>{footer}</div>}
    </dialog>
  );
};
