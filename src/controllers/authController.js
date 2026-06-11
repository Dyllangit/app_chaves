const crypto             = require('crypto');
const Pessoa             = require('../models/Pessoa');
const TokenRedefinicao   = require('../models/TokenRedefinicao');
const { verificarSenha, hashSenha } = require('../services/senhaService');
const { tentarEnviarEmail }         = require('../services/emailService');

const authController = {

    // GET /login
    exibirLogin(req, res) {
        if (req.session.usuario) return res.redirect('/dashboard');
        res.render('auth/login', { title: 'Login', layout: 'layouts/auth' });
    },

    // POST /login
    async fazerLogin(req, res) {
        const { email, senha } = req.body;
        try {
            const pessoa = await Pessoa.findByEmail(email);
            if (!pessoa || !verificarSenha(senha, pessoa.senha_hash)) {
                req.flash('error', 'E-mail ou senha inválidos.');
                return res.redirect('/login');
            }
            req.session.usuario = { id: pessoa.id, nome: pessoa.nome, perfil: pessoa.perfil };
            res.redirect('/dashboard');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Erro interno. Tente novamente.');
            res.redirect('/login');
        }
    },

    // GET /logout
    logout(req, res) {
        req.session.destroy(() => res.redirect('/login'));
    },

    // GET /esqueci-senha
    exibirEsqueciSenha(req, res) {
        res.render('auth/esqueci-senha', { title: 'Recuperar senha', layout: 'layouts/auth' });
    },

    // POST /esqueci-senha
    async solicitarRedefinicao(req, res) {
        const { email } = req.body;
        // Sempre mostra a mesma mensagem, independente de o e-mail existir
        const msgPadrao = 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.';
        try {
            const pessoa = await Pessoa.findByEmail(email);
            if (pessoa) {
                await TokenRedefinicao.invalidarPorPessoa(pessoa.id);
                const token    = crypto.randomBytes(32).toString('hex');
                const expiraEm = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
                await TokenRedefinicao.criar({ pessoa_id: pessoa.id, token, expira_em: expiraEm });

                const link = `${process.env.APP_URL}/redefinir-senha?token=${token}`;
                await tentarEnviarEmail({
                    para:    pessoa.email,
                    assunto: 'SISGERI — Redefinição de senha',
                    html: `
                        <p>Olá, <strong>${pessoa.nome}</strong>.</p>
                        <p>Clique no link abaixo para redefinir sua senha. O link é válido por <strong>1 hora</strong>.</p>
                        <p><a href="${link}">${link}</a></p>
                        <p style="color:#888">Se você não solicitou a redefinição, ignore este e-mail.</p>
                    `,
                });
            }
        } catch (err) {
            console.error(err);
        }
        req.flash('success', msgPadrao);
        res.redirect('/esqueci-senha');
    },

    // GET /redefinir-senha?token=...
    async exibirRedefinirSenha(req, res) {
        const { token } = req.query;
        const registro  = await TokenRedefinicao.findToken(token);
        if (!registro || registro.usado || new Date(registro.expira_em) < new Date()) {
            req.flash('error', 'Link inválido ou expirado. Solicite um novo.');
            return res.redirect('/esqueci-senha');
        }
        res.render('auth/redefinir-senha', { title: 'Nova senha', token, layout: 'layouts/auth' });
    },

    // POST /redefinir-senha
    async redefinirSenha(req, res) {
        const { token, senha, confirmar_senha } = req.body;
        if (senha !== confirmar_senha) {
            req.flash('error', 'As senhas não coincidem.');
            return res.redirect(`/redefinir-senha?token=${token}`);
        }
        try {
            const registro = await TokenRedefinicao.findToken(token);
            if (!registro || registro.usado || new Date(registro.expira_em) < new Date()) {
                req.flash('error', 'Link inválido ou expirado.');
                return res.redirect('/esqueci-senha');
            }
            await Pessoa.atualizar(registro.pessoa_id, { senha_hash: hashSenha(senha) });
            await TokenRedefinicao.marcarUsado(registro.id);
            req.flash('success', 'Senha redefinida com sucesso. Faça login.');
            res.redirect('/login');
        } catch (err) {
            console.error(err);
            req.flash('error', 'Erro ao redefinir senha. Tente novamente.');
            res.redirect(`/redefinir-senha?token=${token}`);
        }
    },
};

module.exports = authController;