const Reserva    = require('../models/Reserva');
const Ambiente   = require('../models/Ambiente');
const Equipamento = require('../models/Equipamento');

const reservaController = {

    // GET /reservas
    async index(req, res) {
        const reservas = await Reserva.listarPorPessoa(req.session.usuario.id);
        res.render('reservas/lista', { title: 'Minhas reservas', reservas });
    },

    // GET /reservas/nova-ambiente
    async novaAmbienteForm(req, res) {
        res.render('reservas/nova-ambiente', { title: 'Reservar ambiente', ambientes: [] });
    },

    // POST /reservas/buscar-ambientes
    async buscarAmbientes(req, res) {
        const { data, horario_inicio, horario_fim } = req.body;
        const ambientes = await Ambiente.listarDisponiveis(data, horario_inicio, horario_fim);
        res.render('reservas/nova-ambiente', {
            title: 'Reservar ambiente', ambientes, data, horario_inicio, horario_fim,
        });
    },

    // POST /reservas/nova-ambiente
    async criarReservaAmbiente(req, res) {
        const { data, horario_inicio, horario_fim, ambiente_id,
                tipo_evento, descricao, docente_responsavel, pessoa_autorizada } = req.body;
        try {
            const reserva_id = await Reserva.criar({
                pessoa_id: req.session.usuario.id, data, horario_inicio, horario_fim,
            });
            const ra_id = await Reserva.criarReservaAmbiente({ reserva_id, ambiente_id });

            if (tipo_evento) {
                await Reserva.criarDetalheEvento({
                    reserva_id, tipo_evento, descricao, docente_responsavel, pessoa_autorizada,
                });
            }

            req.flash('success', `Reserva #${reserva_id} confirmada com sucesso.`);
            res.redirect(`/reservas/${reserva_id}`);
        } catch (err) {
            console.error(err);
            req.flash('error', 'Erro ao criar reserva. Tente novamente.');
            res.redirect('/reservas/nova-ambiente');
        }
    },

    // GET /reservas/nova-equipamento
    async novaEquipamentoForm(req, res) {
        res.render('reservas/nova-equipamento', { title: 'Reservar equipamento', equipamentos: [] });
    },

    // POST /reservas/buscar-equipamentos
    async buscarEquipamentos(req, res) {
        const { data, horario_inicio, horario_fim } = req.body;
        const equipamentos = await Equipamento.listarDisponiveis(data, horario_inicio, horario_fim);
        res.render('reservas/nova-equipamento', {
            title: 'Reservar equipamento', equipamentos, data, horario_inicio, horario_fim,
        });
    },

    // POST /reservas/nova-equipamento
    async criarReservaEquipamento(req, res) {
        const { data, horario_inicio, horario_fim, equipamentos_ids } = req.body;
        const ids = Array.isArray(equipamentos_ids) ? equipamentos_ids : [equipamentos_ids];
        try {
            const reserva_id = await Reserva.criar({
                pessoa_id: req.session.usuario.id, data, horario_inicio, horario_fim,
            });
            for (const equipamento_id of ids) {
                await Reserva.criarReservaEquipamento({ reserva_id, equipamento_id });
            }
            req.flash('success', `Reserva #${reserva_id} confirmada com sucesso.`);
            res.redirect(`/reservas/${reserva_id}`);
        } catch (err) {
            console.error(err);
            req.flash('error', 'Erro ao criar reserva. Tente novamente.');
            res.redirect('/reservas/nova-equipamento');
        }
    },

    // GET /reservas/:id
    async detalhes(req, res) {
        const reserva     = await Reserva.findById(req.params.id);
        if (!reserva) return res.redirect('/reservas');

        const perfil  = req.session.usuario.perfil;
        const ehDono  = reserva.pessoa_id === req.session.usuario.id;
        if (!ehDono && perfil === 'usuario') return res.redirect('/reservas');

        const ambientes    = await Reserva.getAmbientes(reserva.id);
        const equipamentos = await Reserva.getEquipamentos(reserva.id);
        res.render('reservas/detalhes', { title: `Reserva #${reserva.id}`, reserva, ambientes, equipamentos });
    },

    // POST /reservas/:id/cancelar
    async cancelar(req, res) {
        const reserva = await Reserva.findById(req.params.id);
        if (!reserva) return res.redirect('/reservas');

        const ehDono = reserva.pessoa_id === req.session.usuario.id;
        const perfil = req.session.usuario.perfil;
        if (!ehDono && perfil === 'usuario') return res.redirect('/reservas');

        await Reserva.cancelar(reserva.id);
        req.flash('success', 'Reserva cancelada.');
        res.redirect('/reservas');
    },
};

module.exports = reservaController;