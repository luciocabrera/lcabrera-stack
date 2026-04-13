import type { CreateLoggerArgs, LogLevel, Logger } from './logger.types.ts';

import { DEFAULT_LOG_LEVEL, LOG_LEVEL_PRIORITY } from './logger.constants.ts';

/** No-op function reused by all suppressed log methods. */
const noop = (): void => {};

/**
 * Resolves the active log level from the env var, falling back to the default.
 * Validates the value against known levels; returns the default on mismatch.
 */
const resolveLogLevel = (override?: LogLevel): LogLevel => {
  if (override) return override;

  const envLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined;

  if (envLevel && Object.hasOwn(LOG_LEVEL_PRIORITY, envLevel)) return envLevel;

  return DEFAULT_LOG_LEVEL;
};

/**
 * Creates a level-aware logger instance.
 *
 * - Methods below the configured level are replaced with no-ops at creation time
 *   (zero per-call overhead).
 * - In production builds, `debug` / `info` / `warn` bodies are tree-shaken by Vite
 *   because they are guarded by `import.meta.env.PROD`.
 *
 * @example
 * ```ts
 * const log = createLogger({ prefix: '[carSales]' });
 * log.debug('URL:', url);      // only prints when level >= debug
 * log.warn('Slow response');   // only prints when level >= warn
 * log.error('Fetch failed', e); // only prints when level >= error
 * ```
 */
export const createLogger = ({
  level,
  prefix,
}: CreateLoggerArgs = {}): Logger => {
  const activeLevel = resolveLogLevel(level);
  const priority = LOG_LEVEL_PRIORITY[activeLevel];

  const withPrefix = (args: readonly unknown[]): readonly unknown[] =>
    prefix ? [prefix, ...args] : args;

  return {
    debug:
      import.meta.env.PROD || priority < LOG_LEVEL_PRIORITY.debug
        ? noop
        : (...args: readonly unknown[]) => {
            // eslint-disable-next-line no-console -- Logger utility wraps console intentionally
            console.debug(...withPrefix(args));
          },

    error:
      priority < LOG_LEVEL_PRIORITY.error
        ? noop
        : (...args: readonly unknown[]) => {
            // eslint-disable-next-line no-console -- Logger utility wraps console intentionally
            console.error(...withPrefix(args));
          },

    info:
      import.meta.env.PROD || priority < LOG_LEVEL_PRIORITY.info
        ? noop
        : (...args: readonly unknown[]) => {
            // eslint-disable-next-line no-console -- Logger utility wraps console intentionally
            console.info(...withPrefix(args));
          },

    warn:
      import.meta.env.PROD || priority < LOG_LEVEL_PRIORITY.warn
        ? noop
        : (...args: readonly unknown[]) => {
            // eslint-disable-next-line no-console -- Logger utility wraps console intentionally
            console.warn(...withPrefix(args));
          },
  };
};

/**
 * Default application-wide logger.
 * Reads `VITE_LOG_LEVEL` from the environment at module-load time.
 *
 * @example
 * ```ts
 * import { logger } from '@/utils/logger';
 * logger.warn('Something happened');
 * ```
 */
export const logger = createLogger();
