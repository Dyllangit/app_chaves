const Reserva = require('../models/Reserva');
const { tentarEnviarEmail } = require('../services/emailService');

const atrasosController = {

    // GET /atrasos
    async index(req, res) {
        const atrasos = await Reserva.listarAtrasos();
        res.render('atrasos/index', { title: 'Devoluções em atraso', atrasos });
    },

    // POST /atrasos/notificar/:tipo/:item_id
    async notificar(req, res) {
        const { tipo, item_id } = req.params;

        let info;
        const db = require('../config/database');

        if (tipo === 'chave') {
            const [rows] = await db.query(`
                SELECT p.email, p.nome, a.nome AS recurso, r.data, r.horario_fim
                FROM reserva_ambiente ra
                JOIN reserva  r ON r.id = ra.reserva_id
                JOIN pessoa   p ON p.id = r.pessoa_id
                JOIN ambiente a ON a.id = ra.ambiente_id
                WHERE ra.id = ?
            `, [item_id]);
            info = rows[0];
        } else {
            const [rows] = await db.query(`
                SELECT p.email, p.nome, e.nome AS recurso, r.data, r.horario_fim
                FROM reserva_equipamento re
                JOIN reserva     r ON r.id = re.reserva_id
                JOIN pessoa      p ON p.id = r.pessoa_id
                JOIN equipamento e ON e.id = re.equipamento_id
                WHERE re.id = ?
            `, [item_id]);
            info = rows[0];
        }

        if (!info) {
            req.flash('error', 'Item não encontrado.');
            return res.redirect('/atrasos');
        }

        const nomeTipo = tipo === 'chave' ? 'chave' : 'equipamento';
        const resultado = await tentarEnviarEmail({
            para:    info.email,
            assunto: 'SISGERI — Devolução em atraso',
            html: `<p>Olá, <strong>${info.nome}</strong>.</p>
                   <p>Identificamos que a <strong>${nomeTipo}</strong> do recurso
                   <strong>${info.recurso}</strong> não foi devolvida após o horário de término
                   da reserva (${info.data} às ${info.horario_fim}).</p>
                   <p>Por favor, devolva imediatamente na secretaria do IC.</p>`,
        });

        req.flash(
            resultado.sucesso ? 'success' : 'warning',
            resultado.sucesso
                ? `E-mail de cobrança enviado para ${info.email}.`
                : 'Não foi possível enviar o e-mail (sem conexão). Notifique manualmente.'
        );
        res.redirect('/atrasos');
    },
};

module.exports = atrasosController;