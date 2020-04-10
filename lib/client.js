const { Pool } = require('pg');
const { jogooDbConfig } = require('../config');

class jogooClient {

    constructor() {
        this.connection = new Pool(jogooDbConfig);
    }

    /**
     * Run a query.
     * @param {string} query
     * @param {Array} args
     * @return {*|Promise<PermissionStatus>}
     */
    query(query, args) {
        return this.connection.query(query, args);
    }

}

module.exports = new jogooClient();