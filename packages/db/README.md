# Database bootstrap & dialect-switching with Drizzle ORM

> Status: **adopted** · Owner: *Platform team* · Last review: 2025-07-10

## TL;DR
All logic that decides **“which SQL engine am I talking to?”** lives in `drizzle.ts`.  
Everywhere else just does `import { db } from "@hebo/db"` and forgets about drivers.

| Environment | Engine we use | Why |
|-------------|---------------|------|
| Local dev / CI | **SQLite** (`libsql` client) | Zero-setup, single file on disk, fast.
| Preview / Prod | **PostgreSQL** (`pg` Pool) | Horizontal scaling, Aurora Serverless, IAM auth.

---

## Design goals

| Goal | How this package meets it |
|------|---------------------------|
| *Same code runs everywhere* | `initDb()` picks the driver at process start based on env/SST resource detection. |
| *No scattered `if (isLocal)`* | Branching is isolated. API / service layers receive a ready-made `db`. |
| *Keep IntelliSense* | We export an **intersection** type (`SqliteDb & PostgresDb`) which exposes the common Drizzle query-builder API. |
| *Minimal DevOps surface* | Local only needs a SQLite file path. Remote only needs standard PG vars provided by SST. |
| *Easy to add more connections* | Extra factories live in the same file, re-using credential helpers. |

---

## Implementation sketch
```ts
// packages/db/drizzle.ts (excerpt)
const initDb = (): UniversalDb => {
  if (isLocal) {
    const { url } = getDbCredentials();
    const client = createClient({ url });
    return drizzleSqlite(client, { schema: sqliteSchema }) as UniversalDb;
  }

  const { host, port, user, password, database } = getDbCredentials();
  const pool = new Pool({ host, port, user, password, database });
  return drizzlePostgres(pool, { schema: postgresSchema }) as UniversalDb;
};

export const db = initDb();
```
See `utils.ts` for how `isLocal` & credentials are resolved from SST resources *or* explicit env variables.

---

## Operational contract

Environment variable | Local / CI | Preview / Prod
---------------------|------------|---------------
`SQLITE_CONNECTION_STRING` **or** fallback `packages/db/hebo.db` | ✅ | —
`PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD`, `PG_DATABASE` | — | ✅ (injected by SST `HeboDatabase`)

Need to force a mode?  Set `PG_HOST` to anything to pick Postgres, or unset it to fall back to SQLite.

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
* Drizzle PostgreSQL guide – <https://orm.drizzle.team/docs/getting-started-postgresql>
* Drizzle SQLite guide – <https://orm.drizzle.team/docs/getting-started-sqlite>
* SST `Resource` runtime access pattern – see `packages/db/utils.ts`

---

## FAQ
**Is the intersection type unsafe?**  
No.  It only exposes methods common to both drivers.  Dialect-specific helpers should live inside this package.

**Why ENV instead of a flag in code?**  
Environment variables are the twelve-factor standard across Lambda, containers, CI, local dev. They let us rotate credentials without code changes.

---

### Bottom line
The pattern implemented here is the industry playbook for “single code-base, multiple SQL engines”.  By isolating the switch, driven by env/SST resources, and exporting a driver-agnostic `db`, we reduce cognitive load, stay type-safe, and keep deployment simple. 