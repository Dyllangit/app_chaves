const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/chaveController');
const autenticado = require('../middlewares/autenticado');
const autorizado  = require('../middlewares/autorizado');

router.use(autenticado, autorizado('funcionario', 'gestor'));

router.get( '/',                                   ctrl.index);
router.get( '/retirada/:reserva_ambiente_id',      ctrl.formRetirada);
router.post('/retirada/:reserva_ambiente_id',      ctrl.registrarRetirada);
router.get( '/devolucao/:reserva_ambiente_id',     ctrl.formDevolucao);
router.post('/devolucao/:reserva_ambiente_id',     ctrl.registrarDevolucao);

module.exports = router;