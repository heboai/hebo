import { ResourceSafe, safeRead } from "../sst";

// Cached view of the HeboDatabase resource (if present & accessible).
const heboDb = ResourceSafe
  ? (safeRead(() => ResourceSafe.HeboDatabase) ?? {})
  : {};

export type DbConfig = {
  dbCredentials: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: boolean;
  };
};

export function getDrizzleConfig(): DbConfig {
  return {
    dbCredentials: {
      host:
        safeRead(() => (heboDb as any).host) ??
        process.env.POSTGRES_HOST ??
        "localhost",
      port:
        safeRead(() => (heboDb as any).port) ??
        Number(process.env.POSTGRES_PORT ?? 5432),
      user:
        safeRead(() => (heboDb as any).username) ??
        process.env.POSTGRES_USER ??
        "postgres",
      password:
        safeRead(() => (heboDb as any).password) ??
        process.env.POSTGRES_PASSWORD ??
        "",
      database:
        safeRead(() => (heboDb as any).database) ??
        process.env.POSTGRES_DB ??
        "hebo",
      ssl:
        (safeRead(() => (heboDb as any).ssl) ?? process.env.POSTGRES_SSL)
          ? JSON.parse(process.env.POSTGRES_SSL as string)
          : true,
    },
  } as DbConfig;
}
