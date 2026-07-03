import { vi } from 'vitest';

type MockDialogElementArgs = {
  readonly shouldSetOpenOnShow?: boolean;
};

const setDialogOpen = ({
  dialog,
  isOpen,
}: {
  readonly dialog: HTMLDialogElement;
  readonly isOpen: boolean;
}) => {
  Object.defineProperty(dialog, 'open', {
    configurable: true,
    value: isOpen,
    writable: true,
  });
};

const setAllDialogsOpen = ({ isOpen }: { readonly isOpen: boolean }) => {
  const dialogs = document.querySelectorAll('dialog');

  for (const dialog of dialogs) {
    setDialogOpen({
      dialog: dialog as HTMLDialogElement,
      isOpen,
    });
  }
};

export const mockDialogElement = ({
  // eslint-disable-next-line unicorn/consistent-boolean-name
  shouldSetOpenOnShow = true,
}: MockDialogElementArgs = {}) => {
  // eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
  const savedClose = HTMLDialogElement.prototype.close;
  // eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
  const savedShow = HTMLDialogElement.prototype.show;
  // eslint-disable-next-line typescript-eslint/unbound-method -- Saving prototype methods for test teardown restoration
  const savedShowModal = HTMLDialogElement.prototype.showModal;

  const closeMock = vi.fn(() => {
    setAllDialogsOpen({ isOpen: false });
  });
  const showMock = vi.fn(() => {
    if (shouldSetOpenOnShow) {
      setAllDialogsOpen({ isOpen: true });
    }
  });
  const showModalMock = vi.fn(() => {
    setAllDialogsOpen({ isOpen: true });
  });

  HTMLDialogElement.prototype.close = closeMock as HTMLDialogElement['close'];
  HTMLDialogElement.prototype.show = showMock as HTMLDialogElement['show'];
  HTMLDialogElement.prototype.showModal =
    showModalMock as HTMLDialogElement['showModal'];

  return {
    closeMock,
    restore: () => {
      HTMLDialogElement.prototype.close = savedClose;
      HTMLDialogElement.prototype.show = savedShow;
      HTMLDialogElement.prototype.showModal = savedShowModal;
    },
    showMock,
    showModalMock,
  };
};
