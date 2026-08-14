# Vite+ Monorepo Starter

A starter for creating a Vite+ monorepo.

> **[COMMANDS.md](COMMANDS.md) is the canonical command reference** — every root
> script, every per-workspace task, and what CI runs. The few below are just the
> starting points. Project rules and conventions live in [AGENTS.md](AGENTS.md).

## Development

Everything goes through `vp` (Vite+) — never `pnpm`/`npm`/`yarn` directly.

```bash
vp install        # install dependencies
vp run dev        # frontend + express api (dev:fast = fastify, dev:cqms = CQMS)
vp run build:all  # build every workspace
vp run ready      # check everything is ready (full gate + build)
```

Tests:

```bash
vp run test:ci    # every DB-free suite — what CI runs, needs no database
vp run test:all   # every suite, including the DB-bound ones — needs Postgres
```

Before finishing any change, run the quality gate — see
[COMMANDS.md §3](COMMANDS.md#3-the-quality-gate). `vp check` alone is not the
whole gate: it runs neither the eslint pass nor `tsc`.

## Local DB Workflow

From the repository root:

```bash
# Start local postgres
vp run db:up

# Check status
vp run db:status

# Seed the showcase's own tables (seed/db:seed are workspace scripts, so they
# need --filter); car-sales-api seeds its own copy of the car-sales tables
vp run --filter vite-react-compiler seed

# Or do both bring-up + seed
vp run --filter vite-react-compiler db:seed

# Stop local postgres
vp run db:down
```
