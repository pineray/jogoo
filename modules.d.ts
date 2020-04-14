declare namespace NodeJS {
    export interface ProcessEnv {
        JOGOO_DB_USER: string;
        JOGOO_DB_HOST: string;
        JOGOO_DB_NAME: string;
        JOGOO_DB_AUTH: string;
        JOGOO_DB_PORT: number;
        JOGOO_ITEMS_MAX_RETURN: number;
        JOGOO_LINKS_MAX_NUMBER: number;
        JOGOO_RATING_PURCHASED: number;
        JOGOO_RATING_CLICK_INITIAL: number;
        JOGOO_RATING_CLICK_INCREASE: number;
        JOGOO_RATING_NOT_INTERESTED: number;
        JOGOO_RATING_RETENTION_PERIOD: string;
        JOGOO_RATING_THRESHOLD: number;
    }
}