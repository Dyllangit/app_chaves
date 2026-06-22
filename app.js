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

// ── Inicialização automática do banco ─────────────────────────────────────────
async function inicializarBanco() {
    const mysql  = require('mysql2/promise');
    const fs     = require('fs');
    const { hashSenha } = require('./src/services/senhaService');

    const cfg = process.env.DATABASE_URL
        ? { uri: process.env.DATABASE_URL, multipleStatements: true }
        : {
            host:               process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
            port:               process.env.DB_PORT     || process.env.MYSQLPORT     || 3306,
            user:               process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
            password:           process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
            database:           process.env.DB_NAME     || process.env.MYSQLDATABASE || 'sisgeri',
            multipleStatements: true,
        };

    const conn = await mysql.createConnection(cfg);

    const limpar = sql => sql
        .replace(/CREATE\s+DATABASE\s+.*?;/gis, '')
        .replace(/USE\s+\w+\s*;/gi, '');

    const schema = limpar(fs.readFileSync(path.join(__dirname, 'database/schema.sql'), 'utf8'));
    const seed   = limpar(fs.readFileSync(path.join(__dirname, 'database/seed.sql'),   'utf8'));

    await conn.query(schema);
    await conn.query(seed);

    // Cria admin padrão se não existir nenhum gestor
    const [gestores] = await conn.query("SELECT id FROM pessoa WHERE perfil = 'gestor' LIMIT 1");
    if (gestores.length === 0) {
        await conn.query(
            `INSERT INTO pessoa (nome, matricula, email, cargo, perfil, senha_hash)
             VALUES ('Administrador', 'admin001', 'admin@ic.ufmt.br', 'Gestor TI', 'gestor', ?)`,
            [hashSenha('admin123')]
        );
        console.log('Admin criado: admin@ic.ufmt.br / admin123');
    }

    await conn.end();
    console.log('Banco de dados pronto.');
}

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

inicializarBanco()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`SISGERI rodando em http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Falha ao inicializar banco:', err.message);
        process.exit(1);
    });

module.exports = app;