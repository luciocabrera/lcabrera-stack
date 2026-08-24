import type { CreateLoggerArgs, LogLevel } from './logger.types';

import { DEFAULT_LOG_LEVEL, LOG_LEVEL_PRIORITY } from './logger.constants';

const noop = () => {
  /* intentional no-op — replaces log methods below the active level */
};

const resolveLogLevel = (override?: LogLevel) => {
  if (override) return override;

  const envLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined;

  if (envLevel && Object.hasOwn(LOG_LEVEL_PRIORITY, envLevel)) return envLevel;

  return DEFAULT_LOG_LEVEL;
};

/**
 * @example ```ts const log = createLogger({ prefix: '[carSales]' }); log.debug('URL:',
 * url); // only prints when level >= debug log.warn('Slow response'); // only prints when
 * level >= warn log.error('Fetch failed', e); // only prints when level >= error ```
 */
export const createLogger = ({ level, prefix }: CreateLoggerArgs = {}) => {
  const activeLevel = resolveLogLevel(level);
  const priority = LOG_LEVEL_PRIORITY[activeLevel];

  const withPrefix = (args: readonly unknown[]): readonly unknown[] =>
    prefix ? [prefix, ...args] : args;

  return {
    debug:
      import.meta.env.PROD || priority < LOG_LEVEL_PRIORITY.debug
        ? noop
        : (...args: readonly unknown[]) => {
            console.debug(...withPrefix(args));
          },

    error:
      priority < LOG_LEVEL_PRIORITY.error
        ? noop
        : (...args: readonly unknown[]) => {
            console.error(...withPrefix(args));
          },

    info:
      import.meta.env.PROD || priority < LOG_LEVEL_PRIORITY.info
        ? noop
        : (...args: readonly unknown[]) => {
            console.info(...withPrefix(args));
          },

    warn:
      import.meta.env.PROD || priority < LOG_LEVEL_PRIORITY.warn
        ? noop
        : (...args: readonly unknown[]) => {
            console.warn(...withPrefix(args));
          },
  };
};

export const logger = createLogger();
