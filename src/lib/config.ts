export const JOGOO_DB_TYPE = process.env.hasOwnProperty('JOGOO_DB_TYPE') ? String(process.env.JOGOO_DB_TYPE) : 'postgres';
export const JOGOO_DB_USER = process.env.hasOwnProperty('JOGOO_DB_USER') ? String(process.env.JOGOO_DB_USER) : '';
export const JOGOO_DB_HOST = process.env.hasOwnProperty('JOGOO_DB_HOST') ? String(process.env.JOGOO_DB_HOST) : 'localhost';
export const JOGOO_DB_NAME = process.env.hasOwnProperty('JOGOO_DB_NAME') ? String(process.env.JOGOO_DB_NAME) : '';
export const JOGOO_DB_AUTH = process.env.hasOwnProperty('JOGOO_DB_AUTH') ? String(process.env.JOGOO_DB_AUTH) : '';
let dbPort;
if (process.env.hasOwnProperty('JOGOO_DB_PORT')) {
    dbPort = Number(process.env.JOGOO_DB_PORT);
} else if (JOGOO_DB_TYPE === 'postgres' || JOGOO_DB_TYPE === 'postgresql') {
    dbPort = 5432;
} else if (JOGOO_DB_TYPE === 'mariadb' || JOGOO_DB_TYPE === 'mysql') {
    dbPort = 3306;
}
export const JOGOO_DB_PORT = dbPort;

export const JOGOO_ITEMS_MAX_RETURN = process.env.hasOwnProperty('JOGOO_ITEMS_MAX_RETURN') ? Number(process.env.JOGOO_ITEMS_MAX_RETURN) : 1000000;
export const JOGOO_LINKS_MAX_NUMBER = process.env.hasOwnProperty('JOGOO_LINKS_MAX_NUMBER') ? Number(process.env.JOGOO_LINKS_MAX_NUMBER) : 30;
export const JOGOO_RATING_PURCHASED = process.env.hasOwnProperty('JOGOO_RATING_PURCHASED') ? Number(process.env.JOGOO_RATING_PURCHASED) : 1.0;
export const JOGOO_RATING_CLICK_INITIAL = process.env.hasOwnProperty('JOGOO_RATING_CLICK_INITIAL') ? Number(process.env.JOGOO_RATING_CLICK_INITIAL) : 0.7;
export const JOGOO_RATING_CLICK_INCREASE = process.env.hasOwnProperty('JOGOO_RATING_CLICK_INCREASE') ? Number(process.env.JOGOO_RATING_CLICK_INCREASE) : 0.01;
export const JOGOO_RATING_NOT_INTERESTED = process.env.hasOwnProperty('JOGOO_RATING_NOT_INTERESTED') ? Number(process.env.JOGOO_RATING_NOT_INTERESTED) : -1.0;
export const JOGOO_RATING_RETENTION_PERIOD = process.env.hasOwnProperty('JOGOO_RATING_RETENTION_PERIOD') ? String(process.env.JOGOO_RATING_RETENTION_PERIOD) : '-6 months';
export const JOGOO_RATING_THRESHOLD = process.env.hasOwnProperty('JOGOO_RATING_THRESHOLD') ? Number(process.env.JOGOO_RATING_THRESHOLD) : 0.66;
