export interface JogooDialectInterface {

    /**
     * Connect the database.
     * @return Promise<void>
     */
    connect():Promise<void>;

    /**
     * Run a query.
     * @param {string} query
     * @return {*|Promise<Array<{ [key: string]: string|number }>>}
     */
    query(query:string):Promise<Array<{ [key: string]: string|number }>>;

    /**
     * End the connection.
     */
    end():void;

    /**
     * Begin a transaction.
     */
    beginTransaction():Promise<void>;

    /**
     * Commit a transaction.
     */
    commit():Promise<void>;

    /**
     * Rollback a transaction.
     */
    rollback():Promise<void>;

}