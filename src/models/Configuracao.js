const db = require('../config/database');

class Configuracao {
    static async get(chave) {
        const [rows] = await db.query(
            'SELECT valor FROM configuracao WHERE chave = ?', [chave]
        );
        return rows[0]?.valor ?? null;
    }

    static async set(chave, valor) {
        await db.query(
            `INSERT INTO configuracao (chave, valor)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE valor = ?`,
            [chave, valor, valor]
        );
    }

    static async listarTodas() {
        const [rows] = await db.query('SELECT * FROM configuracao ORDER BY chave');
        return rows;
    }
}

module.exports = Configuracao;