import type { LogLevel, LogLevelPriority } from './logger.types';

/**
 * Numeric priority map for log levels.
 * Lower number = higher severity. A configured level enables itself and all lower-numbered levels.
 *
 * | Level    | Priority | Enables                    |
 * | -------- | -------- | -------------------------- |
 * | `silent` | 0        | Nothing                    |
 * | `error`  | 1        | error                      |
 * | `warn`   | 2        | error, warn                |
 * | `info`   | 3        | error, warn, info          |
 * | `debug`  | 4        | error, warn, info, debug   |
 */
export const LOG_LEVEL_PRIORITY: LogLevelPriority = {
  debug: 4,
  error: 1,
  info: 3,
  silent: 0,
  warn: 2,
} as const;

/**
 * Default log level when `VITE_LOG_LEVEL` is not set.
 * - Development: `'info'` — shows errors, warnings, and informational messages.
 * - Production: `'error'` — shows only errors (debug/info/warn are tree-shaken).
 */
export const DEFAULT_LOG_LEVEL: LogLevel = import.meta.env.DEV
  ? 'info'
  : 'error';
