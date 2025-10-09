import { Resource } from "sst";

export const connectionString = (() => {
  try {
    // @ts-expect-error: HeboDatabase may not be defined
    const db = Resource.HeboDatabase;
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}?sslmode=verify-full`;
  } catch {
    return "postgresql://postgres:password@localhost:5432/local";
  }
})();

process.env.DATABASE_URL = connectionString;
