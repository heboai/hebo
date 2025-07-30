# Database bootstrap & dialect-switching with Drizzle ORM

> Status: **adopted** · Owner: *Platform team* · Last review: 2025-07-10

## TL;DR
All logic that decides **“which SQL engine am I talking to?”** lives in `drizzle.ts`.  
Everywhere else just does `import { db } from "@hebo/db"` and forgets about drivers.

| Environment | Engine we use               | Why |
|-------------|-----------------------------|------|
| Local dev / CI | **PGLite** (`pglite` client) | Zero-setup, single directory on disk, fast.
| Preview / Prod | **PostgreSQL** (`pg` Pool)  | Horizontal scaling, Aurora Serverless, IAM auth.

---

## Design goals

| Goal | How this package meets it                                                                                        |
|------|------------------------------------------------------------------------------------------------------------------|
| *Same code runs everywhere* | `initDb()` picks the driver at process start based on env/SST resource detection.                                |
| *No scattered `if (isLocal)`* | Branching is isolated. API / service layers receive a ready-made `db`.                                           |
| *Keep IntelliSense* | We export an **intersection** type (`PgliteDb & PostgresDb`) which exposes the common Drizzle query-builder API. |
| *Minimal DevOps surface* | Local only needs a PGLite directory path. Remote only needs standard PG vars provided by SST.                    |
| *Easy to add more connections* | Extra factories live in the same file, re-using credential helpers.                                              |

---

## Operational contract

Environment variable | Local / CI | Preview / Prod
---------------------|------------|---------------
`PGLITE_PATH` **or** fallback `packages/db/hebo.db` | ✅ | —
`PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | — | ✅ (injected by SST `HeboDatabase`)

Need to force a mode?  Set `PG_HOST` to anything to pick Postgres, or unset it to fall back to PGLite.

---

## Extending / modifying
1. **Add another dialect** – add a new branch in `initDb()`; keep each branch self-contained.
2. **Expose multiple DBs** – export more factories:
   ```ts
   export const analyticsDb = makeAnalyticsDb();
   ```
3. **Never leak `isLocal` outside this package.** If you need a dialect-specific operation, add a helper *inside* `@hebo/db`.

---

## Prior art / references
* Drizzle PostgreSQL guide – <https://orm.drizzle.team/docs/get-started-postgresql>
* Drizzle PGLite guide – <https://orm.drizzle.team/docs/connect-pglite>
* SST `Resource` runtime access pattern – see `packages/db/utils.ts`

---

## FAQ
**Is the intersection type unsafe?**  
No. It only exposes methods common to both drivers.  Dialect-specific helpers should live inside this package.

**Why ENV instead of a flag in code?**  
Environment variables are the twelve-factor standard across Lambda, containers, CI, local dev. They let us rotate credentials without code changes.

---

### Bottom line
The pattern implemented here is the industry playbook for “single code-base, multiple SQL engines”.  By isolating the switch, driven by env/SST resources, and exporting a driver-agnostic `db`, we reduce cognitive load, stay type-safe, and keep deployment simple. 