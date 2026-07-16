type IsPathInIgnoredDirectoryArgs = {
  readonly ignoredDirectories: ReadonlySet<string>;
  readonly relativePath: string;
};

/**
 * True when any segment of a POSIX repo-relative path is a directory the
 * project packer skips (the shared IGNORED_DIRECTORIES set — node_modules,
 * .git, build output). Used to prune a browser folder selection before
 * zipping so a snapshot never carries dependency installs or VCS metadata.
 * Matches whole segments only: `node_modules_helper/x.ts` is kept, only a
 * real `node_modules/` boundary is dropped.
 */
export const isPathInIgnoredDirectory = ({
  ignoredDirectories,
  relativePath,
}: IsPathInIgnoredDirectoryArgs) =>
  relativePath.split('/').some((segment) => ignoredDirectories.has(segment));
