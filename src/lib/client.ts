import { Pool } from 'pg';
import { JOGOO_DB_CONFIG } from './config';

export class JogooClient {

    /** @var {Pool} */
    connection;

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
