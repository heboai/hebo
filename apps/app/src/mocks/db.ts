import DB from '~/vendor/mirage-orm/src/db/DB';

const db = new DB();
db.createCollection('agents');

export default db;