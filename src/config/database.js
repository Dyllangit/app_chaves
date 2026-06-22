const mysql = require('mysql2/promise');

const config = process.env.DATABASE_URL
    ? {
        uri:                process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit:    10,
    }
    : {
        host:               process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
        port:               process.env.DB_PORT     || process.env.MYSQLPORT     || 3306,
        user:               process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
        password:           process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
        database:           process.env.DB_NAME     || process.env.MYSQLDATABASE || 'sisgeri',
        waitForConnections: true,
        connectionLimit:    10,
        timezone:           '-04:00',
        charset:            'utf8mb4',
    };

const pool = mysql.createPool(config);

module.exports = pool;