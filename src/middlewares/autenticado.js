module.exports = (req, res, next) => {
    if (!req.session.usuario) {
        req.flash('error', 'Faça login para continuar.');
        return res.redirect('/login');
    }
    res.locals.usuario = req.session.usuario;
    next();
};