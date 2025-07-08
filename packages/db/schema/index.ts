// Export SQLite schemas by default for local development
// In production, these will be overridden by the PostgreSQL schemas
export * from "./sqlite";

// For production builds, you can override with PostgreSQL schemas
// by using sst deploy 