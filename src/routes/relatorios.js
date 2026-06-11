const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/relatorioController');
const autenticado = require('../middlewares/autenticado');
const autorizado  = require('../middlewares/autorizado');

router.use(autenticado, autorizado('gestor'));

router.get( '/', ctrl.index);
router.post('/', ctrl.gerar);

module.exports = router;