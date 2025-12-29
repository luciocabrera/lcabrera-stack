/// <reference types="vite/client" />

// StyleX virtual modules
declare module 'virtual:stylex:runtime' {
  const runtime: unknown;
  export default runtime;
}

declare module 'virtual:stylex.css' {
  const css: string;
  export default css;
}
