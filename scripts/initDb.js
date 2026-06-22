// Inicializa o banco de dados (schema + seed)
// Execute com: railway run node scripts/initDb.js

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function main() {
    const conn = await mysql.createConnection({
        host:               process.env.DB_HOST,
        port:               process.env.DB_PORT || 3306,
        user:               process.env.DB_USER,
        password:           process.env.DB_PASSWORD,
        database:           process.env.DB_NAME,
        multipleStatements: true,
    });

    console.log('Conectado ao banco.\n');

    // Remove CREATE DATABASE e USE (Railway já provê o banco)
    function limpar(sql) {
        return sql
            .replace(/CREATE\s+DATABASE\s+.*?;/gis, '')
            .replace(/USE\s+\w+\s*;/gi, '');
    }

    const schema = limpar(fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8'));
    const seed   = limpar(fs.readFileSync(path.join(__dirname, '../database/seed.sql'), 'utf8'));

    console.log('Criando tabelas...');
    await conn.query(schema);

    console.log('Inserindo dados iniciais...');
    await conn.query(seed);

    await conn.end();
    console.log('\n✔  Banco inicializado com sucesso!');
}

main().catch(err => {
    console.error('Erro:', err.message);
    process.exit(1);
});