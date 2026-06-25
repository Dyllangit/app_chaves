const Reserva  = require('../models/Reserva');
const Chave    = require('../models/Chave');
const { tentarEnviarEmail } = require('../services/emailService');

const chaveController = {

    // GET /chaves  — listagem do dia (funcionário/gestor)
    async index(req, res) {
        const reservas = await Reserva.listarHoje();
        const modalSuccess = res.locals.success || [];
        res.locals.success = [];   // evita duplicar no banner de alertas
        res.render('chaves/index', { title: 'Movimentação de chaves', reservas, modalSuccess });
    },

    // GET /chaves/retirada/:reserva_ambiente_id
    async formRetirada(req, res) {
        const ra_id   = req.params.reserva_ambiente_id;
        const [rows]  = await require('../config/database').query(`
            SELECT ra.*, a.nome AS ambiente_nome, c.id AS chave_id, c.codigo,
                   r.data, r.horario_inicio, r.horario_fim, p.nome AS pessoa_nome
            FROM reserva_ambiente ra
            JOIN ambiente  a ON a.id  = ra.ambiente_id
            JOIN reserva   r ON r.id  = ra.reserva_id
            JOIN pessoa    p ON p.id  = r.pessoa_id
            LEFT JOIN chave c ON c.ambiente_id = a.id
            WHERE ra.id = ?
        `, [ra_id]);
        const ra = rows[0];
        if (!ra) { req.flash('error', 'Reserva não encontrada.'); return res.redirect('/chaves'); }
        res.render('chaves/retirada', { title: 'Retirada de chave', ra });
    },

    // POST /chaves/retirada/:reserva_ambiente_id
    async registrarRetirada(req, res) {
        const { reserva_ambiente_id, chave_id, observacoes } = req.body;
        try {
            await Chave.registrarMovimentacao({
                chave_id, reserva_ambiente_id,
                pessoa_id: req.session.usuario.id,
                tipo: 'retirada', observacoes,
            });

            // Notificação por e-mail (sem bloqueio)
            const [rows] = await require('../config/database').query(`
                SELECT p.email, p.nome, a.nome AS ambiente_nome, r.data, r.horario_fim
                FROM reserva_ambiente ra
                JOIN reserva  r ON r.id = ra.reserva_id
                JOIN pessoa   p ON p.id = r.pessoa_id
                JOIN ambiente a ON a.id = ra.ambiente_id
                WHERE ra.id = ?
            `, [reserva_ambiente_id]);
            const info = rows[0];
            const resultado = await tentarEnviarEmail({
                para:    info.email,
                assunto: 'SISGERI — Chave retirada',
                html: `<p>Olá, <strong>${info.nome}</strong>.</p>
                       <p>A chave do ambiente <strong>${info.ambiente_nome}</strong> foi retirada em
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
        res.redirect('/chaves');
    },

    // GET /chaves/devolucao/:reserva_ambiente_id
    async formDevolucao(req, res) {
        const ra_id  = req.params.reserva_ambiente_id;
        const [rows] = await require('../config/database').query(`
            SELECT ra.*, a.nome AS ambiente_nome, c.id AS chave_id, c.codigo,
                   r.data, r.horario_inicio, r.horario_fim, p.nome AS pessoa_nome
            FROM reserva_ambiente ra
            JOIN ambiente  a ON a.id  = ra.ambiente_id
            JOIN reserva   r ON r.id  = ra.reserva_id
            JOIN pessoa    p ON p.id  = r.pessoa_id
            LEFT JOIN chave c ON c.ambiente_id = a.id
            WHERE ra.id = ?
        `, [ra_id]);
        const ra = rows[0];
        if (!ra) { req.flash('error', 'Reserva não encontrada.'); return res.redirect('/chaves'); }
        res.render('chaves/devolucao', { title: 'Devolução de chave', ra });
    },

    // POST /chaves/devolucao/:reserva_ambiente_id
    async registrarDevolucao(req, res) {
        const { reserva_ambiente_id, chave_id, tipo, observacoes } = req.body;
        // tipo: 'devolucao' ou 'extravio'
        try {
            await Chave.registrarMovimentacao({
                chave_id, reserva_ambiente_id,
                pessoa_id: req.session.usuario.id,
                tipo, observacoes,
            });

            const [rows] = await require('../config/database').query(`
                SELECT p.email, p.nome, a.nome AS ambiente_nome
                FROM reserva_ambiente ra
                JOIN reserva  r ON r.id = ra.reserva_id
                JOIN pessoa   p ON p.id = r.pessoa_id
                JOIN ambiente a ON a.id = ra.ambiente_id
                WHERE ra.id = ?
            `, [reserva_ambiente_id]);
            const info = rows[0];

            if (tipo === 'devolucao') {
                const resultado = await tentarEnviarEmail({
                    para:    info.email,
                    assunto: 'SISGERI — Chave devolvida',
                    html: `<p>Olá, <strong>${info.nome}</strong>.</p>
                           <p>A chave do ambiente <strong>${info.ambiente_nome}</strong> foi devolvida em
                           ${new Date().toLocaleString('pt-BR')}.</p>`,
                });
                req.flash('success',
                    resultado.sucesso
                        ? 'Devolução registrada. E-mail enviado.'
                        : 'Devolução registrada com sucesso. Não foi possível enviar o e-mail de notificação (sem conexão).'
                );
            } else {
                req.flash('warning', 'Extravio registrado. Chave marcada como extraviada.');
            }
        } catch (err) {
            console.error(err);
            req.flash('error', 'Erro ao registrar devolução.');
        }
        res.redirect('/chaves');
    },
};

module.exports = chaveController;