// StyleX virtual modules — provided at runtime by @stylexjs/unplugin in
// whichever app's Vite instance processes this package's source. Declared
// here so this package's own standalone typecheck resolves them without
// depending on a consuming app's own vite-env.d.ts.
declare module 'virtual:stylex:runtime' {
  const runtime: unknown;
  export default runtime;
}

declare module 'virtual:stylex.css' {
  const css: string;
  export default css;
}
