import { JOGOO_DB_TYPE } from './config';
import { JogooDialectInterface } from "../db/interface";

export class JogooClient {

    dbType:string;
    dialect:JogooDialectInterface;

    constructor() {
        this.dbType = JOGOO_DB_TYPE;
        if (this.dbType === 'postgresql') {
            this.dbType = 'postgres';
        }

        let Dialect;
        switch (this.dbType) {
            case 'postgres':
                Dialect = require('../db/postgres');
                break;
            default:
                throw new Error(`The DB type ${this.dbType} is not supported. Support DB type: postgres.`);
        }

        this.dialect = new Dialect();
    }

    /**
     * Run a query.
     * @param {string} query
     * @return {*|Promise<Array<{ [key: string]: string|number }>>}
     */
    query(query:string):Promise<Array<{ [key: string]: string|number }>> {
        return this.dialect.query(query);
    }

    /**
     * End the connection.
     */
    end():void {
        this.dialect.end();
    }

    /**
     * Begin a transaction.
     */
    beginTransaction():Promise<void> {
        return this.dialect.beginTransaction();
    }

    /**
     * Commit a transaction.
     */
    commit():Promise<void> {
        return this.dialect.commit();
    }

    /**
     * Rollback a transaction.
     */
    rollback():Promise<void> {
        return this.dialect.rollback();
    }

}
