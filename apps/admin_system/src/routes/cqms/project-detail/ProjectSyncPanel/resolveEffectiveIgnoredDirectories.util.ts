type ResolveEffectiveIgnoredDirectoriesArgs = {
  readonly baseIgnored: ReadonlySet<string>;
  readonly includeNodeModules: boolean;
};

/**
 * The ignore-set actually applied to a browser folder pick. `node_modules` is
 * the one entry a user may opt back into (dependency sources are occasionally
 * needed for a scanner to resolve imports); every other ignored directory
 * (.git, build, dist, coverage, …) is derived/VCS noise that is never useful
 * in a code snapshot and stays excluded regardless. Returns a fresh set only
 * when opting node_modules in, so the shared base constant is never mutated.
 */
export const resolveEffectiveIgnoredDirectories = ({
  baseIgnored,
  includeNodeModules,
}: ResolveEffectiveIgnoredDirectoriesArgs) =>
  includeNodeModules
    ? new Set(
        [...baseIgnored].filter((directory) => directory !== 'node_modules'),
      )
    : baseIgnored;
