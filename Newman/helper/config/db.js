const knex = require('knex');
const config = require('./knex');


const db = knex(config);

export default db;
