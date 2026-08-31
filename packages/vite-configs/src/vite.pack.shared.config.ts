/**
 * The `vp pack` (tsdown) settings every publishable Node/browser package uses.
 *
 * These packages are consumed from outside this monorepo, where a `.ts` file in
 * `node_modules` is not loadable: Node refuses to strip types for anything under
 * `node_modules` and throws `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING`. Vite
 * externalizes dependencies for SSR by default, so a package whose `exports`
 * point at source fails when the consumer's server starts — not when it is
 * typechecked. Building to `dist` is what makes them ordinary npm packages.
 *
 * `exports` still points at `src` inside this repo; pnpm substitutes
 * `publishConfig.exports` at pack time (verified by reading a real tarball), so
 * no workspace has to build before it can typecheck, test or run.
 *
 * `packages/ui` deliberately does NOT use this. Its StyleX theme identity is
 * derived from the package name plus the defining file's path relative to the
 * package root, and `processStylexRules` names layers by emission order, so two
 * independently-generated stylesheets cannot compose. It ships source and the
 * consumer's own StyleX plugin compiles it.
 */
export const createPackConfig = () => ({
  dts: { tsconfig: 'tsconfig.app.json' },
  entry: ['src/**/*.ts', '!src/**/*.test.ts'],
  sourcemap: true,
  unbundle: true,
});
