const db = require('../config/database');

class TokenRedefinicao {
    static async criar({ pessoa_id, token, expira_em }) {
        await db.query(
            'INSERT INTO token_redefinicao (pessoa_id, token, expira_em) VALUES (?, ?, ?)',
            [pessoa_id, token, expira_em]
        );
    }

    static async findToken(token) {
        const [rows] = await db.query(
            'SELECT * FROM token_redefinicao WHERE token = ?', [token]
        );
        return rows[0] || null;
    }

    static async invalidarPorPessoa(pessoa_id) {
        await db.query(
            'UPDATE token_redefinicao SET usado = 1 WHERE pessoa_id = ? AND usado = 0',
            [pessoa_id]
        );
    }

    static async marcarUsado(id) {
        await db.query('UPDATE token_redefinicao SET usado = 1 WHERE id = ?', [id]);
    }
}

module.exports = TokenRedefinicao;