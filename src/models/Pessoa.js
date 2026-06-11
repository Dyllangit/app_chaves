const db = require('../config/database');

class Pessoa {
    static async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM pessoa WHERE email = ? AND ativo = 1', [email]
        );
        return rows[0] || null;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM pessoa WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async listarTodos() {
        const [rows] = await db.query(
            'SELECT id, nome, matricula, cpf, email, cargo, perfil, ativo, criado_em FROM pessoa ORDER BY nome'
        );
        return rows;
    }

    static async criar(dados) {
        const { nome, matricula, cpf, email, cargo, perfil, senha_hash } = dados;
        const [result] = await db.query(
            `INSERT INTO pessoa (nome, matricula, cpf, email, cargo, perfil, senha_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nome, matricula || null, cpf || null, email, cargo || null, perfil, senha_hash]
        );
        return result.insertId;
    }

    static async atualizar(id, dados) {
        const campos  = Object.keys(dados).map(k => `${k} = ?`).join(', ');
        const valores = [...Object.values(dados), id];
        await db.query(`UPDATE pessoa SET ${campos} WHERE id = ?`, valores);
    }

    static async alternarAtivo(id, ativo) {
        await db.query('UPDATE pessoa SET ativo = ? WHERE id = ?', [ativo, id]);
    }
}

module.exports = Pessoa;