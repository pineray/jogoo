const JogooUpdate = require('./lib/update');
const JogooClient = require('./lib/client');
const client = new JogooClient();

const jogooUpdate = new JogooUpdate(client, 'links');
jogooUpdate.updateAll();