/**
 * Configuration for `createLogger` factory.
 */
export type CreateLoggerArgs = {
  /** Log level override. Defaults to `VITE_LOG_LEVEL` env var or `'info'` in dev / `'error'` in prod. */
  readonly level?: LogLevel;
  /** Optional prefix prepended to every message, e.g. `'[carSales]'`. */
  readonly prefix?: string;
};

/**
 * Log level determines which messages are printed.
 * Levels are ordered by priority: silent < error < warn < info < debug.
 * Setting a level enables that level and all levels above it (lower priority number).
 */
export type LogLevel = 'debug' | 'error' | 'info' | 'silent' | 'warn';

/**
 * Numeric priority for each log level.
 * Lower number = higher severity. `silent` suppresses all output.
 */
export type LogLevelPriority = Record<LogLevel, number>;
