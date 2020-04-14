const { JogooUpdate, JogooClient } = require('./dist/src/index');
const client = new JogooClient();

const jogooUpdate = new JogooUpdate(client, 'slope');
jogooUpdate.updateAll();