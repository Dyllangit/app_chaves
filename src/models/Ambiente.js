const db = require('../config/database');

class Ambiente {
    static async listarAtivos() {
        const [rows] = await db.query(
            'SELECT * FROM ambiente WHERE ativo = 1 ORDER BY nome'
        );
        return rows;
    }

    static async listarTodos() {
        const [rows] = await db.query('SELECT * FROM ambiente ORDER BY nome');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM ambiente WHERE id = ?', [id]);
        return rows[0] || null;
    }

    // Retorna ambientes sem conflito de horário na data informada
    static async listarDisponiveis(data, horarioInicio, horarioFim) {
        const [rows] = await db.query(`
            SELECT a.* FROM ambiente a
            WHERE a.ativo = 1
              AND a.id NOT IN (
                  SELECT ra.ambiente_id
                  FROM reserva_ambiente ra
                  JOIN reserva r ON r.id = ra.reserva_id
                  WHERE r.data = ?
                    AND r.status = 'confirmada'
                    AND ra.status NOT IN ('cancelada','chave_devolvida','chave_extraviada')
                    AND r.horario_inicio < ?
                    AND r.horario_fim   > ?
              )
            ORDER BY a.nome
        `, [data, horarioFim, horarioInicio]);
        return rows;
    }

    static async criar(dados) {
        const { nome, tipo, capacidade, localizacao } = dados;
        const [result] = await db.query(
            'INSERT INTO ambiente (nome, tipo, capacidade, localizacao) VALUES (?, ?, ?, ?)',
            [nome, tipo, capacidade || null, localizacao || null]
        );
        return result.insertId;
    }

    static async atualizar(id, dados) {
        const campos  = Object.keys(dados).map(k => `${k} = ?`).join(', ');
        const valores = [...Object.values(dados), id];
        await db.query(`UPDATE ambiente SET ${campos} WHERE id = ?`, valores);
    }

    static async alternarAtivo(id, ativo) {
        await db.query('UPDATE ambiente SET ativo = ? WHERE id = ?', [ativo, id]);
    }
}

module.exports = Ambiente;