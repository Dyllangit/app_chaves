const Pessoa        = require('../models/Pessoa');
const Ambiente      = require('../models/Ambiente');
const Chave         = require('../models/Chave');
const Equipamento   = require('../models/Equipamento');
const Configuracao  = require('../models/Configuracao');
const { hashSenha } = require('../services/senhaService');

const adminController = {

    // ── Usuários ──────────────────────────────────────────────────────────────

    async listarUsuarios(req, res) {
        const usuarios = await Pessoa.listarTodos();
        res.render('admin/usuarios', { title: 'Usuários', usuarios });
    },

    async formNovoUsuario(req, res) {
        res.render('admin/usuario-form', { title: 'Novo usuário', usuario: null });
    },

    async criarUsuario(req, res) {
        const { nome, matricula, cpf, email, cargo, perfil, senha } = req.body;
        try {
            await Pessoa.criar({ nome, matricula, cpf, email, cargo, perfil, senha_hash: hashSenha(senha) });
            req.flash('success', 'Usuário criado com sucesso.');
        } catch (err) {
            console.error(err);
            req.flash('error', err.code === 'ER_DUP_ENTRY'
                ? 'E-mail, matrícula ou CPF já cadastrado.'
                : 'Erro ao criar usuário.');
        }
        res.redirect('/admin/usuarios');
    },

    async formEditarUsuario(req, res) {
        const usuario = await Pessoa.findById(req.params.id);
        if (!usuario) return res.redirect('/admin/usuarios');
        res.render('admin/usuario-form', { title: 'Editar usuário', usuario });
    },

    async atualizarUsuario(req, res) {
        const { nome, matricula, cpf, email, cargo, perfil, senha } = req.body;
        const dados = { nome, matricula, cpf, email, cargo, perfil };
        if (senha) dados.senha_hash = hashSenha(senha);
        try {
            await Pessoa.atualizar(req.params.id, dados);
            req.flash('success', 'Usuário atualizado.');
        } catch (err) {
            req.flash('error', 'Erro ao atualizar usuário.');
        }
        res.redirect('/admin/usuarios');
    },

    async alternarAtivoUsuario(req, res) {
        const usuario = await Pessoa.findById(req.params.id);
        if (usuario) await Pessoa.alternarAtivo(usuario.id, usuario.ativo ? 0 : 1);
        res.redirect('/admin/usuarios');
    },

    // ── Ambientes ─────────────────────────────────────────────────────────────

    async listarAmbientes(req, res) {
        const ambientes = await Ambiente.listarTodos();
        res.render('admin/ambientes', { title: 'Ambientes', ambientes });
    },

    async formNovoAmbiente(req, res) {
        res.render('admin/ambiente-form', { title: 'Novo ambiente', ambiente: null });
    },

    async criarAmbiente(req, res) {
        const { nome, tipo, capacidade, localizacao, chave_codigo } = req.body;
        try {
            const ambiente_id = await Ambiente.criar({ nome, tipo, capacidade, localizacao });
            if (chave_codigo) await Chave.criar({ codigo: chave_codigo, ambiente_id });
            req.flash('success', 'Ambiente criado com sucesso.');
        } catch (err) {
            req.flash('error', 'Erro ao criar ambiente.');
        }
        res.redirect('/admin/ambientes');
    },

    async formEditarAmbiente(req, res) {
        const ambiente = await Ambiente.findById(req.params.id);
        if (!ambiente) return res.redirect('/admin/ambientes');
        res.render('admin/ambiente-form', { title: 'Editar ambiente', ambiente });
    },

    async atualizarAmbiente(req, res) {
        const { nome, tipo, capacidade, localizacao } = req.body;
        try {
            await Ambiente.atualizar(req.params.id, { nome, tipo, capacidade, localizacao });
            req.flash('success', 'Ambiente atualizado.');
        } catch (err) {
            req.flash('error', 'Erro ao atualizar ambiente.');
        }
        res.redirect('/admin/ambientes');
    },

    async alternarAtivoAmbiente(req, res) {
        const amb = await Ambiente.findById(req.params.id);
        if (amb) await Ambiente.alternarAtivo(amb.id, amb.ativo ? 0 : 1);
        res.redirect('/admin/ambientes');
    },

    // ── Equipamentos ──────────────────────────────────────────────────────────

    async listarEquipamentos(req, res) {
        const equipamentos = await Equipamento.listarTodos();
        res.render('admin/equipamentos', { title: 'Equipamentos', equipamentos });
    },

    async formNovoEquipamento(req, res) {
        res.render('admin/equipamento-form', { title: 'Novo equipamento', equipamento: null });
    },

    async criarEquipamento(req, res) {
        const { nome, categoria, codigo_patrimonio } = req.body;
        try {
            await Equipamento.criar({ nome, categoria, codigo_patrimonio });
            req.flash('success', 'Equipamento criado com sucesso.');
        } catch (err) {
            req.flash('error', 'Erro ao criar equipamento.');
        }
        res.redirect('/admin/equipamentos');
    },

    async formEditarEquipamento(req, res) {
        const equip = await Equipamento.findById(req.params.id);
        if (!equip) return res.redirect('/admin/equipamentos');
        res.render('admin/equipamento-form', { title: 'Editar equipamento', equipamento: equip });
    },

    async atualizarEquipamento(req, res) {
        const { nome, categoria, codigo_patrimonio, status } = req.body;
        try {
            await Equipamento.atualizar(req.params.id, { nome, categoria, codigo_patrimonio, status });
            req.flash('success', 'Equipamento atualizado.');
        } catch (err) {
            req.flash('error', 'Erro ao atualizar equipamento.');
        }
        res.redirect('/admin/equipamentos');
    },

    // ── Configurações ─────────────────────────────────────────────────────────

    async listarConfiguracoes(req, res) {
        const configs = await Configuracao.listarTodas();
        res.render('admin/configuracoes', { title: 'Configurações', configs });
    },

    async salvarConfiguracoes(req, res) {
        const { chave, valor } = req.body;
        const chaves = Array.isArray(chave) ? chave : [chave];
        const valores = Array.isArray(valor) ? valor : [valor];
        try {
            for (let i = 0; i < chaves.length; i++) {
                await Configuracao.set(chaves[i], valores[i]);
            }
            req.flash('success', 'Configurações salvas.');
        } catch (err) {
            req.flash('error', 'Erro ao salvar configurações.');
        }
        res.redirect('/admin/configuracoes');
    },
};

module.exports = adminController;