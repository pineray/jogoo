import { Pool } from 'pg';
import { JOGOO_DB_CONFIG } from './config';

export class JogooClient {

    /** @var {Pool} */
    connection:Pool;

    constructor() {
        this.connection = new Pool(JOGOO_DB_CONFIG);
    }

    /**
     * Run a query.
     * @param {string} query
     * @param {Array<string|number>} args
     * @return {*|Promise<PermissionStatus>}
     */
    query(query:string, args:Array<string|number> = []) {
        return this.connection.query(query, args);
    }

}
