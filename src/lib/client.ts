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
     * @return {*|Promise<Array<{ [key: string]: string|number }>>}
     */
    query(query:string):Promise<Array<{ [key: string]: string|number }>> {
        return new Promise((resolve, reject) => {
            this.connection.query(query)
                .then((res) => {
                    resolve(res.rows);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

}
