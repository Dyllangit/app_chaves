const db = require('../config/database');

class Reserva {
    // ── Criação ──────────────────────────────────────────────────────────────

    static async criar({ pessoa_id, data, horario_inicio, horario_fim }) {
        const [result] = await db.query(
            'INSERT INTO reserva (pessoa_id, data, horario_inicio, horario_fim) VALUES (?, ?, ?, ?)',
            [pessoa_id, data, horario_inicio, horario_fim]
        );
        return result.insertId;
    }

    static async criarReservaAmbiente({ reserva_id, ambiente_id }) {
        const [result] = await db.query(
            'INSERT INTO reserva_ambiente (reserva_id, ambiente_id) VALUES (?, ?)',
            [reserva_id, ambiente_id]
        );
        return result.insertId;
    }

    static async criarReservaEquipamento({ reserva_id, equipamento_id, reserva_ambiente_id }) {
        const [result] = await db.query(
            'INSERT INTO reserva_equipamento (reserva_id, equipamento_id, reserva_ambiente_id) VALUES (?, ?, ?)',
            [reserva_id, equipamento_id, reserva_ambiente_id || null]
        );
        return result.insertId;
    }

    static async criarDetalheEvento({ reserva_id, tipo_evento, descricao, docente_responsavel, pessoa_autorizada }) {
        await db.query(
            `INSERT INTO detalhe_evento (reserva_id, tipo_evento, descricao, docente_responsavel, pessoa_autorizada)
             VALUES (?, ?, ?, ?, ?)`,
            [reserva_id, tipo_evento, descricao || null, docente_responsavel || null, pessoa_autorizada || null]
        );
    }

    // ── Consultas ─────────────────────────────────────────────────────────────

    static async findById(id) {
        const [rows] = await db.query(`
            SELECT r.*, p.nome AS pessoa_nome, p.email AS pessoa_email, p.matricula AS pessoa_matricula
            FROM reserva r
            JOIN pessoa p ON p.id = r.pessoa_id
            WHERE r.id = ?
        `, [id]);
        return rows[0] || null;
    }

    static async listarPorPessoa(pessoa_id) {
        const [rows] = await db.query(`
            SELECT r.*,
                   GROUP_CONCAT(DISTINCT a.nome SEPARATOR ', ') AS ambientes,
                   GROUP_CONCAT(DISTINCT e.nome SEPARATOR ', ') AS equipamentos
            FROM reserva r
            LEFT JOIN reserva_ambiente  ra ON ra.reserva_id = r.id
            LEFT JOIN ambiente           a ON a.id = ra.ambiente_id
            LEFT JOIN reserva_equipamento re ON re.reserva_id = r.id
            LEFT JOIN equipamento         e ON e.id = re.equipamento_id
            WHERE r.pessoa_id = ?
            GROUP BY r.id
            ORDER BY r.data DESC, r.horario_inicio DESC
        `, [pessoa_id]);
        return rows;
    }

    static async listarHoje() {
        const [rows] = await db.query(`
            SELECT r.*, ra.id AS ra_id, p.nome AS pessoa_nome,
                   a.nome AS ambiente_nome, ra.status AS ra_status,
                   c.status AS chave_status
            FROM reserva r
            JOIN pessoa           p  ON p.id  = r.pessoa_id
            JOIN reserva_ambiente ra ON ra.reserva_id = r.id
            JOIN ambiente         a  ON a.id  = ra.ambiente_id
            LEFT JOIN chave       c  ON c.ambiente_id = a.id
            WHERE r.data = CURDATE() AND r.status = 'confirmada'
            ORDER BY r.horario_inicio
        `);
        return rows;
    }

    static async getAmbientes(reserva_id) {
        const [rows] = await db.query(`
            SELECT ra.*, a.nome AS ambiente_nome, a.tipo, c.id AS chave_id, c.codigo AS chave_codigo, c.status AS chave_status
            FROM reserva_ambiente ra
            JOIN ambiente a ON a.id = ra.ambiente_id
            LEFT JOIN chave c ON c.ambiente_id = a.id
            WHERE ra.reserva_id = ?
        `, [reserva_id]);
        return rows;
    }

    static async getEquipamentos(reserva_id) {
        const [rows] = await db.query(`
            SELECT re.*, e.nome AS equipamento_nome, e.categoria, e.codigo_patrimonio
            FROM reserva_equipamento re
            JOIN equipamento e ON e.id = re.equipamento_id
            WHERE re.reserva_id = ?
        `, [reserva_id]);
        return rows;
    }

    // ── Atrasos ───────────────────────────────────────────────────────────────

    static async listarAtrasos() {
        const [rows] = await db.query(`
            SELECT 'chave' AS tipo,
                   ra.id   AS item_id,
                   a.nome  AS recurso,
                   p.nome  AS responsavel,
                   p.email AS email_responsavel,
                   r.data,
                   r.horario_fim,
                   ra.status
            FROM reserva_ambiente ra
            JOIN reserva  r ON r.id  = ra.reserva_id
            JOIN ambiente a ON a.id  = ra.ambiente_id
            JOIN pessoa   p ON p.id  = r.pessoa_id
            WHERE ra.status = 'chave_entregue'
              AND TIMESTAMP(r.data, r.horario_fim) < NOW()

            UNION ALL

            SELECT 'equipamento'  AS tipo,
                   re.id          AS item_id,
                   e.nome         AS recurso,
                   p.nome         AS responsavel,
                   p.email        AS email_responsavel,
                   r.data,
                   r.horario_fim,
                   re.status
            FROM reserva_equipamento re
            JOIN reserva     r ON r.id  = re.reserva_id
            JOIN equipamento e ON e.id  = re.equipamento_id
            JOIN pessoa      p ON p.id  = r.pessoa_id
            WHERE re.status = 'equipamento_entregue'
              AND TIMESTAMP(r.data, r.horario_fim) < NOW()

            ORDER BY data ASC, horario_fim ASC
        `);
        return rows;
    }

    // ── Cancelamento ──────────────────────────────────────────────────────────

    static async cancelar(id) {
        const conn = await db.getConnection();
        try {
            await conn.beginTransaction();
            await conn.query("UPDATE reserva              SET status = 'cancelada' WHERE id = ?", [id]);
            await conn.query("UPDATE reserva_ambiente     SET status = 'cancelada' WHERE reserva_id = ?", [id]);
            await conn.query("UPDATE reserva_equipamento  SET status = 'cancelada' WHERE reserva_id = ?", [id]);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            throw err;
        } finally {
            conn.release();
        }
    }

    // ── Relatórios ────────────────────────────────────────────────────────────

    static async relatorioAmbientes({ dataInicio, dataFim }) {
        const [rows] = await db.query(`
            SELECT a.nome AS ambiente, a.tipo,
                   COUNT(ra.id) AS total_reservas,
                   SUM(CASE WHEN ra.status = 'chave_devolvida' THEN 1 ELSE 0 END) AS concluidas,
                   SUM(CASE WHEN ra.status = 'cancelada'       THEN 1 ELSE 0 END) AS canceladas
            FROM reserva_ambiente ra
            JOIN ambiente a ON a.id = ra.ambiente_id
            JOIN reserva  r ON r.id = ra.reserva_id
            WHERE r.data BETWEEN ? AND ?
            GROUP BY a.id
            ORDER BY total_reservas DESC
        `, [dataInicio, dataFim]);
        return rows;
    }

    static async relatorioEquipamentos({ dataInicio, dataFim }) {
        const [rows] = await db.query(`
            SELECT e.nome AS equipamento, e.categoria,
                   COUNT(re.id) AS total_emprestimos,
                   SUM(CASE WHEN re.status = 'equipamento_devolvido' THEN 1 ELSE 0 END) AS devolvidos
            FROM reserva_equipamento re
            JOIN equipamento e ON e.id = re.equipamento_id
            JOIN reserva     r ON r.id = re.reserva_id
            WHERE r.data BETWEEN ? AND ?
            GROUP BY e.id
            ORDER BY total_emprestimos DESC
        `, [dataInicio, dataFim]);
        return rows;
    }
}

module.exports = Reserva;