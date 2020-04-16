import { Pool } from 'pg';
import { JogooDialectInterface } from './interface';

class JogooDialectPostgres implements JogooDialectInterface {
    /** @var {Pool} */
    connection:Pool;

    constructor(options:object) {
        this.connection = new Pool(options);
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

    /**
     * End the connection.
     */
    end():void {
        this.connection.end();
    }

    /**
     * Begin a transaction.
     */
    beginTransaction():Promise<void> {
        return this.connection.query('BEGIN');
    }

    /**
     * Commit a transaction.
     */
    commit():Promise<void> {
        return this.connection.query('COMMIT');
    }

    /**
     * Rollback a transaction.
     */
    rollback():Promise<void> {
        return this.connection.query('ROLLBACK');
    }
}

module.exports = JogooDialectPostgres;