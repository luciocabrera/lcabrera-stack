type RegisterShutdownSignalsArgs = {
  readonly shutdown: () => Promise<void>;
};

/**
 * The two signals a container runtime actually sends: SIGTERM on `docker
 * stop`/orchestrator eviction, SIGINT on Ctrl-C in a dev shell. A service
 * that wires only one of them appears to shut down gracefully in
 * development and gets killed mid-flight in production.
 */
const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

/**
 * Runs `shutdown` when the process is asked to terminate.
 *
 * A rejected `shutdown` is logged, never rethrown: throwing out of a signal
 * handler surfaces as an unhandled rejection and tears the process down
 * harder than the graceful path this is meant to provide — the failure is
 * worth reporting, but it must not become the exit path itself.
 *
 * Registering process handlers is a side effect by definition, so this is
 * for a service's **entry point** to call (see this package's
 * `ARCHITECTURE.md`) — never a module being imported for something else.
 */
export const registerShutdownSignals = ({
  shutdown,
}: RegisterShutdownSignalsArgs) => {
  for (const signal of SHUTDOWN_SIGNALS) {
    process.on(signal, () => {
      void shutdown().catch((error: unknown) => {
        console.error(`❌ Error during ${signal} shutdown:`, error);
      });
    });
  }
};
