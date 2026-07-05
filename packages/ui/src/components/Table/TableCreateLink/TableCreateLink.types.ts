export type TableCreateLinkProps = {
  /** Route to navigate to, e.g. '/cqms/projects/new'. */
  readonly to: string;
  /** Whatever the table's own title is, e.g. 'Projects' — tooltip reads "Create {title}". */
  readonly title: string;
};
