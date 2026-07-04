import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLogger, logger } from './logger.util';

describe('logger.util', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('only logs messages enabled for the configured level', () => {
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const testLogger = createLogger({ level: 'warn' });

    testLogger.debug('debug');
    testLogger.info('info');
    testLogger.warn('warn');
    testLogger.error('error');

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith('warn');
    expect(errorSpy).toHaveBeenCalledWith('error');
  });

  it('prepends the configured prefix to log messages', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    const testLogger = createLogger({
      level: 'info',
      prefix: '[orders]',
    });

    testLogger.info('loaded', 3);

    expect(infoSpy).toHaveBeenCalledWith('[orders]', 'loaded', 3);
  });

  it('keeps the default singleton logger available', () => {
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });
});
