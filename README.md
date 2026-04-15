# Vite+ Monorepo Starter

A starter for creating a Vite+ monorepo.

## Development

- Check everything is ready:

```bash
vp run ready
```

- Run the tests:

```bash
vp run test -r
```

- Build the monorepo:

```bash
vp run build:all
```

- Run the development server:

```bash
vp run dev
```

## Local DB Workflow

From the repository root:

```bash
# Start local postgres
vp run db:up

# Check status
vp run db:status

# Seed data
vp run seed

# Or do both bring-up + seed
vp run db:seed

# Stop local postgres
vp run db:down
```
