export type CreateLoggerArgs = {
  readonly level?: LogLevel;
  /** Optional prefix prepended to every message, e.g. `'[carSales]'`. */
  readonly prefix?: string;
};

export type LogLevel = 'debug' | 'error' | 'info' | 'silent' | 'warn';

export type LogLevelPriority = Record<LogLevel, number>;
