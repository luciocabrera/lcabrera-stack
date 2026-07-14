export type TableCreateLinkProps = {
  /** Loading flag — mirrors the settings button so the create button shows the same busy overlay while the table loads. */
  readonly isBusy?: boolean;
  /** Whatever the table's own title is, e.g. 'Projects' — tooltip reads "Create {title}". */
  readonly title: string;
  /** Route to navigate to, e.g. '/cqms/projects/new'. */
  readonly to: string;
};
