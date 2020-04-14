const JogooUpdate = require('./lib/update');
const JogooClient = require('./lib/client');
const client = new JogooClient();

const jogooUpdate = new JogooUpdate(client, 'slope');
jogooUpdate.updateAll();
jogooUpdate.updateAll();