import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerShutdownSignals } from './registerShutdownSignals.util.ts';

/**
 * Spies on `process.on` rather than emitting real signals: emitting would run
 * vitest's own SIGINT handling, and `removeAllListeners` would delete it.
 * Returning `process` unregistered keeps the handlers off the real process.
 */
const spyOnSignalRegistration = () =>
  vi.spyOn(process, 'on').mockReturnValue(process);

type FindHandlerArgs = {
  readonly signal: string;
  readonly spy: SignalRegistrationSpy;
};

type SignalRegistrationSpy = ReturnType<typeof spyOnSignalRegistration>;

const findHandler = ({ signal, spy }: FindHandlerArgs) =>
  spy.mock.calls.find(([registered]) => registered === signal)?.[1];

const registeredSignals = (spy: SignalRegistrationSpy) =>
  spy.mock.calls.map(([signal]) => signal);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('registerShutdownSignals', () => {
  it('wires both of the signals a container runtime sends', () => {
    const spy = spyOnSignalRegistration();

    registerShutdownSignals({ shutdown: vi.fn() });

    expect(registeredSignals(spy)).toEqual(['SIGINT', 'SIGTERM']);
  });

  it('runs shutdown when a signal fires', () => {
    const spy = spyOnSignalRegistration();
    const shutdown = vi.fn().mockResolvedValue(undefined);

    registerShutdownSignals({ shutdown });
    findHandler({ signal: 'SIGTERM', spy })?.();

    expect(shutdown).toHaveBeenCalledOnce();
  });

  it('reports a failing shutdown instead of letting it escape as an unhandled rejection', async () => {
    const spy = spyOnSignalRegistration();
    const error = new Error('pool never drained');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    registerShutdownSignals({ shutdown: vi.fn().mockRejectedValue(error) });
    findHandler({ signal: 'SIGINT', spy })?.();

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '❌ Error during SIGINT shutdown:',
        error,
      );
    });
  });

  it('names the signal that failed, so the two handlers stay tellable apart', async () => {
    const spy = spyOnSignalRegistration();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    registerShutdownSignals({
      shutdown: vi.fn().mockRejectedValue(new Error('nope')),
    });
    findHandler({ signal: 'SIGTERM', spy })?.();

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '❌ Error during SIGTERM shutdown:',
        expect.any(Error),
      );
    });
  });
});
