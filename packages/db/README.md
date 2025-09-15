# Database bootstrap & dialect-switching with Drizzle ORM

## TL;DR

Driver selection lives in `drizzle.ts`; consumers create a client with `createDb()`.

Example (singleton):

```ts
import { createDb } from "@hebo/db/drizzle";

export const db = await createDb();
```

| Environment    | Engine we use                | Why                                              |
| -------------- | ---------------------------- | ------------------------------------------------ |
| Local dev / CI | **PGLite** (`pglite` client) | Zero-setup, single directory on disk, fast.      |
| Preview / Prod | **PostgreSQL** (`pg` Pool)   | Horizontal scaling, Aurora Serverless, IAM auth. |

---

## Design goals

| Goal                                  | How this package meets it                                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| _Single entrypoint, no env branching_ | `createDb()` picks the driver at process start; you can export a singleton or pass a client where needed. |
| _Keep IntelliSense_                   | We expose a unified client type covering the common Drizzle query‑builder API across drivers.             |
| _Minimal DevOps surface_              | Local needs only a PGLite directory path; remote uses standard PG vars provided by SST.                   |
| _Easy to add more connections_        | Extra factories live in the same file, re-using credential helpers.                                       |

---

## Operational contract

| Environment variable                                          | Local / CI | Preview / Prod |
| ------------------------------------------------------------- | ---------- | -------------- |
| `PGLITE_PATH` **or** fallback `packages/db/hebo.db`           | ✅         | —              |
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | —          | ✅             |
