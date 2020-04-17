import { JOGOO_DB_TYPE, JOGOO_DB_USER, JOGOO_DB_HOST, JOGOO_DB_NAME, JOGOO_DB_AUTH, JOGOO_DB_PORT } from './config';
import { JogooDialectInterface } from "../db/interface";

export class JogooClient {

    dbType:string;
    dialect:JogooDialectInterface;
    options:{[key: string]: string|number} = {};

    constructor(options?:{[key: string]: string|number}) {
        if (options !== undefined) {
            if (options.hasOwnProperty('dialect')) {
                this.dbType = String(options.dialect);
            }
            if (options.hasOwnProperty('user')) {
                this.options.user = String(options.user);
            }
            if (options.hasOwnProperty('host')) {
                this.options.host = String(options.host);
            }
            if (options.hasOwnProperty('database')) {
                this.options.database = String(options.database);
            }
            if (options.hasOwnProperty('password')) {
                this.options.password = String(options.password);
            }
            if (options.hasOwnProperty('port')) {
                this.options.port = String(options.port);
            }
        } else {
            this.dbType = JOGOO_DB_TYPE;
            if (JOGOO_DB_USER.length > 0) {
                this.options.user = JOGOO_DB_USER;
            }
            if (JOGOO_DB_HOST.length > 0) {
                this.options.host = JOGOO_DB_HOST;
            }
            if (JOGOO_DB_NAME.length > 0) {
                this.options.database = JOGOO_DB_NAME;
            }
            if (JOGOO_DB_AUTH.length > 0) {
                this.options.password = JOGOO_DB_AUTH;
            }
            this.options.port = JOGOO_DB_PORT;
        }
        if (this.dbType === 'postgresql') {
            this.dbType = 'postgres';
        }

        let Dialect;
        switch (this.dbType) {
            case 'mariadb':
            case 'mysql':
                Dialect = require('../db/mysql');
                break;
            case 'postgres':
                Dialect = require('../db/postgres');
                break;
            default:
                throw new Error(`The DB type ${this.dbType} is not supported. Support DB type: postgres.`);
        }

        this.dialect = new Dialect(this.options);
    }

    connect() {
        return this.dialect.connect();
    }

    /**
     * Run a query.
     * @param {string} query
     * @return {*|Promise<Array<{ [key: string]: string|number }>>}
     */
    query(query:string):Promise<Array<{ [key: string]: string|number }>> {
        return this.dialect.query(query).catch((err) => {
            this.end();
            throw err;
        });
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
