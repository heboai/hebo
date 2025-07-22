import { migrate } from 'drizzle-orm/postgres-js/migrator';
import db from './factory'

const main = async () => {
  console.log('Migrating database...');
  await migrate(db!, { migrationsFolder: './drizzle' });
  console.log('Database migrated successfully!');
};

main();
