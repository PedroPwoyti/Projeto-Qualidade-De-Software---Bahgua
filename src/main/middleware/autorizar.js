function autorizar(...perfisPermitidos) {
    return (req, res, next) => {
        if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
            return res.status(403).json({ erro: 'Acesso não autorizado para o perfil atual.' });
        }
        return next();
    };
}

module.exports = autorizar;
