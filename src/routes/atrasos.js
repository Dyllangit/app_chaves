const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/atrasosController');
const autenticado = require('../middlewares/autenticado');
const autorizado  = require('../middlewares/autorizado');

router.use(autenticado, autorizado('funcionario', 'gestor'));

router.get( '/',                          ctrl.index);
router.post('/notificar/:tipo/:item_id',  ctrl.notificar);

module.exports = router;