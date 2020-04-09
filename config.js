const JogooConfig = {
    jogooDbConfig: {
        user: process.env.JOGOO_DB_USER || 'postgres',
        host: process.env.JOGOO_DB_HOST || '127.0.0.1',
        database: process.env.JOGOO_DB_NAME || 'jogoodb',
        password: process.env.JOGOO_DB_AUTH || 'postgres',
        port: process.env.JOGOO_DB_AUTH || 5432
    }
};

module.exports = JogooConfig;