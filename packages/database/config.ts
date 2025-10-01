import { Resource } from "sst";

export const connectionString = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (Resource as any).HeboDatabase;
    return `postgresql://${db.username}:${db.password}@${db.host}:${db.port}/${db.database}?sslmode=verify-full`;
  } catch {
    return "postgresql://postgres:password@localhost:5432/local";
  }
})();

process.env.DATABASE_URL = connectionString;
