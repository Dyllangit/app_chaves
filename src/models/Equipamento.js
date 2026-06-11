const db = require('../config/database');

class Equipamento {
    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM equipamento WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async listarTodos() {
        const [rows] = await db.query('SELECT * FROM equipamento ORDER BY nome');
        return rows;
    }

    // Retorna equipamentos disponíveis sem conflito de horário
    static async listarDisponiveis(data, horarioInicio, horarioFim) {
        const [rows] = await db.query(`
            SELECT e.* FROM equipamento e
            WHERE e.status = 'disponivel'
              AND e.id NOT IN (
                  SELECT re.equipamento_id
                  FROM reserva_equipamento re
                  JOIN reserva r ON r.id = re.reserva_id
                  WHERE r.data = ?
                    AND r.status = 'confirmada'
                    AND re.status NOT IN ('cancelada','equipamento_devolvido')
                    AND r.horario_inicio < ?
                    AND r.horario_fim   > ?
              )
            ORDER BY e.categoria, e.nome
        `, [data, horarioFim, horarioInicio]);
        return rows;
    }

    static async criar(dados) {
        const { nome, categoria, codigo_patrimonio } = dados;
        const [result] = await db.query(
            'INSERT INTO equipamento (nome, categoria, codigo_patrimonio) VALUES (?, ?, ?)',
            [nome, categoria, codigo_patrimonio || null]
        );
        return result.insertId;
    }

    static async atualizar(id, dados) {
        const campos  = Object.keys(dados).map(k => `${k} = ?`).join(', ');
        const valores = [...Object.values(dados), id];
        await db.query(`UPDATE equipamento SET ${campos} WHERE id = ?`, valores);
    }

    // Registra movimentação e atualiza status do equipamento e da reserva_equipamento
    static async registrarMovimentacao({ equipamento_id, reserva_equipamento_id, pessoa_id, tipo, observacoes }) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();

            await conn.query(
                `INSERT INTO mov_equipamento (equipamento_id, reserva_equipamento_id, pessoa_id, tipo, observacoes)
                 VALUES (?, ?, ?, ?, ?)`,
                [equipamento_id, reserva_equipamento_id, pessoa_id, tipo, observacoes || null]
            );

            const statusEquip = tipo === 'retirada' ? 'disponivel' : 'disponivel'; // sempre volta a disponivel
            const statusRe    = tipo === 'retirada' ? 'equipamento_entregue' : 'equipamento_devolvido';

            // Equipamento fica indisponível apenas enquanto está emprestado (status da reserva controla)
            // Aqui apenas atualizamos a reserva_equipamento
            await conn.query('UPDATE reserva_equipamento SET status = ? WHERE id = ?',
                [statusRe, reserva_equipamento_id]);

            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }
}

module.exports = Equipamento;