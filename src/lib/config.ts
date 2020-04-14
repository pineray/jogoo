export const JOGOO_DB_CONFIG = {
    user: process.env.JOGOO_DB_USER || 'postgres',
    host: process.env.JOGOO_DB_HOST || '127.0.0.1',
    database: process.env.JOGOO_DB_NAME || 'jogoodb',
    password: process.env.JOGOO_DB_AUTH || 'postgres',
    port: process.env.JOGOO_DB_PORT || 5432
};

export const JOGOO_ITEMS_MAX_RETURN = process.env.JOGOO_ITEMS_MAX_RETURN || 1000000;
export const JOGOO_LINKS_MAX_NUMBER = process.env.JOGOO_LINKS_MAX_NUMBER || 30;
export const JOGOO_RATING_PURCHASED = process.env.JOGOO_RATING_PURCHASED || 1.0;
export const JOGOO_RATING_CLICK_INITIAL = process.env.JOGOO_RATING_CLICK_INITIAL || 0.7;
export const JOGOO_RATING_CLICK_INCREASE = process.env.JOGOO_RATING_CLICK_INCREASE || 0.01;
export const JOGOO_RATING_NOT_INTERESTED = process.env.JOGOO_RATING_NOT_INTERESTED || -1.0;
export const JOGOO_RATING_RETENTION_PERIOD = process.env.JOGOO_RATING_RETENTION_PERIOD || '-6 months';
export const JOGOO_RATING_THRESHOLD = process.env.JOGOO_RATING_THRESHOLD || 0.66;
