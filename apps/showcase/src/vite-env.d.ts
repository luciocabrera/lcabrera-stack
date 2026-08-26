/// <reference types="vite-plus/client" />

type ImportMetaEnv = {
  readonly VITE_LOG_LEVEL?: 'debug' | 'error' | 'info' | 'silent' | 'warn';
};

// StyleX virtual modules
declare module 'virtual:stylex:runtime' {
  const runtime: unknown;
  export default runtime;
}

declare module 'virtual:stylex.css' {
  const css: string;
  export default css;
}
