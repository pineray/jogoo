const { Pool } = require('pg');
const { JOGOO_DB_CONFIG } = require('../config');

class JogooClient {

    constructor() {
        this.connection = new Pool(JOGOO_DB_CONFIG);
    }

    /**
     * Run a query.
     * @param {string} query
     * @param {Array} args
     * @return {*|Promise<PermissionStatus>}
     */
    query(query, args = []) {
        return this.connection.query(query, args);
    }

}

module.exports = new JogooClient();