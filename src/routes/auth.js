const express       = require('express');
const router        = express.Router();
const auth          = require('../controllers/authController');
const autenticado   = require('../middlewares/autenticado');

router.get( '/login',           auth.exibirLogin);
router.post('/login',           auth.fazerLogin);
router.get( '/logout',          auth.logout);
router.get( '/esqueci-senha',   auth.exibirEsqueciSenha);
router.post('/esqueci-senha',   auth.solicitarRedefinicao);
router.get( '/redefinir-senha', auth.exibirRedefinirSenha);
router.post('/redefinir-senha', auth.redefinirSenha);

// Dashboard (rota raiz autenticada)
router.get('/dashboard', autenticado, (req, res) => {
    res.render('dashboard/index', { title: 'Dashboard' });
});

// Redireciona / para /dashboard ou /login
router.get('/', (req, res) => {
    res.redirect(req.session.usuario ? '/dashboard' : '/login');
});

module.exports = router;