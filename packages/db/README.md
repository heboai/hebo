# Database bootstrap & dialect-switching with Drizzle ORM

## TL;DR

Driver selection lives in `drizzle.ts`; consumers just `import { db } from "@hebo/db"`.

| Environment    | Engine we use                | Why                                              |
| -------------- | ---------------------------- | ------------------------------------------------ |
| Local dev / CI | **PGLite** (`pglite` client) | Zero-setup, single directory on disk, fast.      |
| Preview / Prod | **PostgreSQL** (`pg` Pool)   | Horizontal scaling, Aurora Serverless, IAM auth. |

---

## Design goals

| Goal                                  | How this package meets it                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| _Single entrypoint, no env branching_ | `initDb()` picks the driver at process start; API/service layers receive a ready-made `db`.                 |
| _Keep IntelliSense_                   | We export an **intersection** type (`PgliteDb & PostgresDb`) exposing the common Drizzle query-builder API. |
| _Minimal DevOps surface_              | Local needs only a PGLite directory path; remote uses standard PG vars provided by SST.                     |
| _Easy to add more connections_        | Extra factories live in the same file, re-using credential helpers.                                         |

---

## Operational contract

| Environment variable                                          | Local / CI | Preview / Prod |
| ------------------------------------------------------------- | ---------- | -------------- |
| `PGLITE_PATH` **or** fallback `packages/db/hebo.db`           | ✅         | —              |
| `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | —          | ✅             |
