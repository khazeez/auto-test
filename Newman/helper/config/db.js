import knex from 'knex'
import config from './knex'


const db = knex(config);

export default db;
