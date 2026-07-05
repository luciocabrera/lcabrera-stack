export type PathBrowserModalProps = {
  readonly browseAction: string;
  readonly initialPath?: string;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSelect: (path: string) => void;
};
