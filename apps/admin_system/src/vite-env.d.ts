/// <reference types="vite-plus/client" />

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- interface required for declaration merging with Vite's ImportMetaEnv
interface ImportMetaEnv {
  readonly VITE_LOG_LEVEL?: 'debug' | 'error' | 'info' | 'silent' | 'warn';
  /** apps/scan-orchestrator's own WS origin (TECH_SPEC §2.7) — a separate process/port, not same-origin. */
  readonly VITE_SCAN_ORCHESTRATOR_WS_URL?: string;
}

// StyleX virtual modules
declare module 'virtual:stylex:runtime' {
  const runtime: unknown;
  export default runtime;
}

declare module 'virtual:stylex.css' {
  const css: string;
  export default css;
}
