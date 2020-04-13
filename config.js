const JOGOO_CONFIG = {
    JOGOO_DB_CONFIG: {
        user: process.env.JOGOO_DB_USER || 'postgres',
        host: process.env.JOGOO_DB_HOST || '127.0.0.1',
        database: process.env.JOGOO_DB_NAME || 'jogoodb',
        password: process.env.JOGOO_DB_AUTH || 'postgres',
        port: process.env.JOGOO_DB_AUTH || 5432
    },
    JOGOO_ITEMS_MAX_RETURN: 1000000,
    JOGOO_LINKS_MAX_NUMBER: 30,
    JOGOO_RATING_PURCHASED: 1.0,
    JOGOO_RATING_CLICK_INITIAL: 0.7,
    JOGOO_RATING_CLICK_INCREASE: 0.01,
    JOGOO_RATING_NOT_INTERESTED: -1.0,
    JOGOO_RATING_RETENTION_PERIOD: '-6 months',
    JOGOO_RATING_THRESHOLD: 0.66
};

module.exports = JOGOO_CONFIG;