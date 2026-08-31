/**
 * SIGTERM and SIGINT are the two signals a container runtime actually sends —
 * SIGTERM on `docker stop` or an orchestrator eviction, SIGINT on Ctrl-C in a
 * dev shell. A service wiring only one appears to shut down gracefully in
 * development and gets killed mid-flight in production.
 *
 * Registering process handlers is a side effect by definition, so this is for a
 * service's entry point to call (see this package's `ARCHITECTURE.md`), never a
 * module imported for something else. A rejected `shutdown` is logged and never
 * rethrown: an unhandled rejection out of a signal handler tears the process
 * down harder than the graceful path this exists to provide.
 */

type RegisterShutdownSignalsArgs = {
  readonly shutdown: () => Promise<void>;
};

const SHUTDOWN_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

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
