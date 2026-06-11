const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/equipamentoController');
const autenticado = require('../middlewares/autenticado');
const autorizado  = require('../middlewares/autorizado');

router.use(autenticado, autorizado('funcionario', 'gestor'));

router.get( '/movimentacoes',                               ctrl.index);
router.post('/retirada/:reserva_equipamento_id',            ctrl.registrarRetirada);
router.post('/devolucao/:reserva_equipamento_id',           ctrl.registrarDevolucao);

module.exports = router;