import { JogooDialectInterface } from './interface';
import { Pool, PoolConnection } from "mysql2/promise";
const mysql = require('mysql2/promise');

class JogooDialectMysql implements JogooDialectInterface {

    pool:Pool;
    connection:PoolConnection;

    constructor(options:object) {
        this.pool = mysql.createPool(options);
    }

    /**
     * Connect the database.
     * @return Promise<void>
     */
    async connect() {
        await this.pool.getConnection().then((connection) => {
            this.connection = connection;
        });
    }

    /**
     * Begin a transaction.
     */
    beginTransaction(): Promise<void> {
        return this.connection.beginTransaction();
    }

    /**
     * Commit a transaction.
     */
    commit(): Promise<void> {
        return this.connection.commit();
    }

    /**
     * End the connection.
     */
    end(): void {
        this.connection.release();
        this.pool.end();
    }

    /**
     * Run a query.
     * @param {string} query
     * @return {*|Promise<Array<{ [key: string]: string|number }>>}
     */
    query(query: string): Promise<Array<{ [p: string]: string | number }>> {
        return new Promise((resolve, reject) => {
            this.connection.query(query)
                .then(([rows]) => {
                    let ret:Array<{ [key: string]: string|number }> = [];
                    if (Array.isArray(rows)) {
                        rows.forEach((row) => {
                            ret.push(Object.assign({}, row));
                        });
                    }
                    resolve(ret);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * Rollback a transaction.
     */
    rollback(): Promise<void> {
        return this.connection.rollback();
    }

}

module.exports = JogooDialectMysql;
