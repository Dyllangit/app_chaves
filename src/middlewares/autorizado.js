// Uso: autorizado('gestor') ou autorizado('funcionario', 'gestor')
module.exports = (...perfis) => (req, res, next) => {
    if (!req.session.usuario || !perfis.includes(req.session.usuario.perfil)) {
        return res.status(403).render('erros/403', { title: 'Acesso negado' });
    }
    next();
};