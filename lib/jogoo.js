const jogooClient = require('./client');

class Jogoo {

    /**
     * @param {jogooClient} client
     */
    constructor(client) {
        this.client = client;
    }

}

module.exports = new Jogoo(jogooClient);