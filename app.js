require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const flash          = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const path           = require('path');

const app = express();

// ── View engine ────────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// ── Arquivos estáticos ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Parsing de corpo ───────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Sessão ─────────────────────────────────────────────────────────────────────
app.use(session({
    secret:            process.env.SESSION_SECRET || 'sisgeri_dev_secret',
    resave:            false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 8,                        // 8 horas
        secure: process.env.NODE_ENV === 'production',
    },
}));

// ── Flash messages ─────────────────────────────────────────────────────────────
app.use(flash());

// ── Variáveis globais para todas as views ──────────────────────────────────────
app.use((req, res, next) => {
    res.locals.usuario  = req.session.usuario || null;
    res.locals.success  = req.flash('success');
    res.locals.error    = req.flash('error');
    res.locals.warning  = req.flash('warning');
    next();
});

// ── Rotas ──────────────────────────────────────────────────────────────────────
app.use('/',            require('./src/routes/auth'));
app.use('/reservas',    require('./src/routes/reservas'));
app.use('/chaves',      require('./src/routes/chaves'));
app.use('/equipamentos',require('./src/routes/equipamentos'));
app.use('/atrasos',     require('./src/routes/atrasos'));
app.use('/relatorios',  require('./src/routes/relatorios'));
app.use('/admin',       require('./src/routes/admin'));

// ── 404 ────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('erros/404', { title: 'Página não encontrada' });
});

// ── Inicialização ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`SISGERI rodando em http://localhost:${PORT}`);
});

module.exports = app;