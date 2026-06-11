const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/reservaController');
const autenticado = require('../middlewares/autenticado');

router.use(autenticado);

router.get( '/',                       ctrl.index);
router.get( '/nova-ambiente',          ctrl.novaAmbienteForm);
router.post('/buscar-ambientes',       ctrl.buscarAmbientes);
router.post('/nova-ambiente',          ctrl.criarReservaAmbiente);
router.get( '/nova-equipamento',       ctrl.novaEquipamentoForm);
router.post('/buscar-equipamentos',    ctrl.buscarEquipamentos);
router.post('/nova-equipamento',       ctrl.criarReservaEquipamento);
router.get( '/:id',                    ctrl.detalhes);
router.post('/:id/cancelar',           ctrl.cancelar);

module.exports = router;