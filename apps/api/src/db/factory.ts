import { drizzle as dbPostgres } from 'drizzle-orm/node-postgres';
import { drizzle as dbPgLite } from 'drizzle-orm/pglite';

const appEnv = process.env.APP_ENV
const dbUrl = process.env.DATABASE_URL
let db

if (appEnv === 'dev') {
  db = dbPgLite()
}

if (appEnv === 'prod') {
  db = dbPostgres(dbUrl!)
}

export default db
