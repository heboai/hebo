import DB from '~/miragejs/orm/db/DB';

const db = new DB();
db.createCollection('agents');

export default db;