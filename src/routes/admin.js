const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/adminController');
const autenticado = require('../middlewares/autenticado');
const autorizado  = require('../middlewares/autorizado');

router.use(autenticado, autorizado('gestor'));

// Usuários
router.get( '/usuarios',          ctrl.listarUsuarios);
router.get( '/usuarios/novo',     ctrl.formNovoUsuario);
router.post('/usuarios/novo',     ctrl.criarUsuario);
router.get( '/usuarios/:id/editar',       ctrl.formEditarUsuario);
router.post('/usuarios/:id/editar',       ctrl.atualizarUsuario);
router.post('/usuarios/:id/toggle-ativo', ctrl.alternarAtivoUsuario);

// Ambientes
router.get( '/ambientes',         ctrl.listarAmbientes);
router.get( '/ambientes/novo',    ctrl.formNovoAmbiente);
router.post('/ambientes/novo',    ctrl.criarAmbiente);
router.get( '/ambientes/:id/editar',      ctrl.formEditarAmbiente);
router.post('/ambientes/:id/editar',      ctrl.atualizarAmbiente);
router.post('/ambientes/:id/toggle-ativo',ctrl.alternarAtivoAmbiente);

// Equipamentos
router.get( '/equipamentos',      ctrl.listarEquipamentos);
router.get( '/equipamentos/novo', ctrl.formNovoEquipamento);
router.post('/equipamentos/novo', ctrl.criarEquipamento);
router.get( '/equipamentos/:id/editar',   ctrl.formEditarEquipamento);
router.post('/equipamentos/:id/editar',   ctrl.atualizarEquipamento);

// Configurações
router.get( '/configuracoes',     ctrl.listarConfiguracoes);
router.post('/configuracoes',     ctrl.salvarConfiguracoes);

module.exports = router;