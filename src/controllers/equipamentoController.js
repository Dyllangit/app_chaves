const Equipamento = require('../models/Equipamento');
const { tentarEnviarEmail } = require('../services/emailService');

const equipamentoController = {

    // GET /equipamentos/movimentacoes
    async index(req, res) {
        const [rows] = await require('../config/database').query(`
            SELECT re.*, e.nome AS equipamento_nome, e.categoria,
                   r.data, r.horario_inicio, r.horario_fim,
                   p.nome AS pessoa_nome
            FROM reserva_equipamento re
            JOIN equipamento e ON e.id = re.equipamento_id
            JOIN reserva     r ON r.id = re.reserva_id
            JOIN pessoa      p ON p.id = r.pessoa_id
            WHERE r.data = CURDATE() AND r.status = 'confirmada'
            ORDER BY r.horario_inicio
        `);
        res.render('equipamentos/movimentacoes', { title: 'Empréstimos de equipamentos', itens: rows });
    },

    // POST /equipamentos/retirada/:reserva_equipamento_id
    async registrarRetirada(req, res) {
        const { reserva_equipamento_id, equipamento_id, observacoes } = req.body;
        try {
            await Equipamento.registrarMovimentacao({
                equipamento_id, reserva_equipamento_id,
                pessoa_id: req.session.usuario.id,
                tipo: 'retirada', observacoes,
            });

            const [rows] = await require('../config/database').query(`
                SELECT p.email, p.nome, e.nome AS equip_nome, r.data, r.horario_fim
                FROM reserva_equipamento re
                JOIN reserva     r ON r.id = re.reserva_id
                JOIN pessoa      p ON p.id = r.pessoa_id
                JOIN equipamento e ON e.id = re.equipamento_id
                WHERE re.id = ?
            `, [reserva_equipamento_id]);
            const info = rows[0];

            const resultado = await tentarEnviarEmail({
                para:    info.email,
                assunto: 'SISGERI — Equipamento retirado',
                html: `<p>Olá, <strong>${info.nome}</strong>.</p>
                       <p>O equipamento <strong>${info.equip_nome}</strong> foi retirado em
                       ${new Date().toLocaleString('pt-BR')}.</p>
                       <p>Devolva até o fim da reserva: ${info.data} às ${info.horario_fim}.</p>`,
            });

            req.flash('success',
                resultado.sucesso
                    ? 'Retirada registrada. E-mail enviado.'
                    : 'Retirada registrada com sucesso. Não foi possível enviar o e-mail de notificação (sem conexão).'
            );
        } catch (err) {
            console.error(err);
            req.flash('error', 'Erro ao registrar retirada.');
        }
        res.redirect('/equipamentos/movimentacoes');
    },

    // POST /equipamentos/devolucao/:reserva_equipamento_id
    async registrarDevolucao(req, res) {
        const { reserva_equipamento_id, equipamento_id, observacoes } = req.body;
        try {
            await Equipamento.registrarMovimentacao({
                equipamento_id, reserva_equipamento_id,
                pessoa_id: req.session.usuario.id,
                tipo: 'devolucao', observacoes,
            });

            const [rows] = await require('../config/database').query(`
                SELECT p.email, p.nome, e.nome AS equip_nome
                FROM reserva_equipamento re
                JOIN reserva     r ON r.id = re.reserva_id
                JOIN pessoa      p ON p.id = r.pessoa_id
                JOIN equipamento e ON e.id = re.equipamento_id
                WHERE re.id = ?
            `, [reserva_equipamento_id]);
            const info = rows[0];

            const resultado = await tentarEnviarEmail({
                para:    info.email,
                assunto: 'SISGERI — Equipamento devolvido',
                html: `<p>Olá, <strong>${info.nome}</strong>.</p>
                       <p>O equipamento <strong>${info.equip_nome}</strong> foi devolvido em
                       ${new Date().toLocaleString('pt-BR')}.</p>`,
            });

            req.flash('success',
                resultado.sucesso
                    ? 'Devolução registrada. E-mail enviado.'
                    : 'Devolução registrada com sucesso. Não foi possível enviar o e-mail de notificação (sem conexão).'
            );
        } catch (err) {
            console.error(err);
            req.flash('error', 'Erro ao registrar devolução.');
        }
        res.redirect('/equipamentos/movimentacoes');
    },
};

module.exports = equipamentoController;