const { Pool } = require('pg');
const JogooUpdate = require('./lib/update');
const { JOGOO_DB_CONFIG } = require('./config');
const client = new Pool(JOGOO_DB_CONFIG);

const jogooUpdate = new JogooUpdate(client, 'links');
jogooUpdate.updateAll();