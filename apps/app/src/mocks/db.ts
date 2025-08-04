import DB from '~/mocks/miragejs/orm/db/DB';

const db = new DB();
db.createCollection('agents');

export default db;