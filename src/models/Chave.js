const db = require('../config/database');

class Chave {
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM chave WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async findByAmbiente(ambiente_id) {
        const [rows] = await db.query(
            'SELECT * FROM chave WHERE ambiente_id = ?', [ambiente_id]
        );
        return rows[0] || null;
    }

    static async atualizarStatus(id, status) {
        await db.query('UPDATE chave SET status = ? WHERE id = ?', [status, id]);
    }

    static async criar(dados) {
        const { codigo, ambiente_id } = dados;
        const [result] = await db.query(
            'INSERT INTO chave (codigo, ambiente_id) VALUES (?, ?)',
            [codigo, ambiente_id]
        );
        return result.insertId;
    }

    // Registra movimentação e atualiza status da chave e da reserva_ambiente
    static async registrarMovimentacao({ chave_id, reserva_ambiente_id, pessoa_id, tipo, observacoes }) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            await conn.query(
                `INSERT INTO mov_chave (chave_id, reserva_ambiente_id, pessoa_id, tipo, observacoes)
                 VALUES (?, ?, ?, ?, ?)`,
                [chave_id, reserva_ambiente_id, pessoa_id, tipo, observacoes || null]
            );

            const statusChave = tipo === 'retirada'  ? 'entregue'
                              : tipo === 'devolucao'  ? 'disponivel'
                              : 'extraviada'; // extravio

            const statusRa   = tipo === 'retirada'  ? 'chave_entregue'
                             : tipo === 'devolucao'  ? 'chave_devolvida'
                             : 'chave_extraviada';

            await conn.query('UPDATE chave SET status = ? WHERE id = ?',
                [statusChave, chave_id]);

            await conn.query('UPDATE reserva_ambiente SET status = ? WHERE id = ?',
                [statusRa, reserva_ambiente_id]);

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}

module.exports = Chave;