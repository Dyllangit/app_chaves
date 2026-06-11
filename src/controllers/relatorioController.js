const Reserva = require('../models/Reserva');

const relatorioController = {

    // GET /relatorios
    index(req, res) {
        res.render('relatorios/index', { title: 'Relatórios', dados: null, tipo: null });
    },

    // POST /relatorios
    async gerar(req, res) {
        const { tipo, data_inicio, data_fim } = req.body;
        let dados = [];

        if (tipo === 'ambientes') {
            dados = await Reserva.relatorioAmbientes({ dataInicio: data_inicio, dataFim: data_fim });
        } else if (tipo === 'equipamentos') {
            dados = await Reserva.relatorioEquipamentos({ dataInicio: data_inicio, dataFim: data_fim });
        }

        res.render('relatorios/index', {
            title: 'Relatórios', dados, tipo, data_inicio, data_fim,
        });
    },
};

module.exports = relatorioController;