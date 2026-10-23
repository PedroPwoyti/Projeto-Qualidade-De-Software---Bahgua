const jwt = require('jsonwebtoken');
const funcionarioRepository = require('../repository/FuncionarioRepository');

function autenticar(req, res, next) {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader || typeof authHeader !== 'string') {
        return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
    }

    const partes = authHeader.trim().split(' ');
    if (partes.length !== 2 || partes[0] !== 'Bearer') {
        return res.status(401).json({ erro: 'Formato do cabeçalho de autenticação inválido. Utilize: Bearer <token>.' });
    }

    const token = partes[1];
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ erro: 'Chave de autenticação JWT não configurada.' });
    }
    if (!token) {
        return res.status(401).json({ erro: 'Token de autenticação ausente.' });
    }

    let payload;
    try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch (erro) {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }

    const funcionario = funcionarioRepository.buscarPorId(payload.id);
    if (!funcionario) {
        return res.status(401).json({ erro: 'Token inválido.' });
    }

    if (!funcionario.ativo) {
        return res.status(403).json({ erro: 'Funcionário inativo. Acesso negado.' });
    }

    req.usuario = {
        id: funcionario.id,
        superAdmin: funcionario.superAdmin,
        perfil: funcionario.perfil
    };

    return next();
}

module.exports = autenticar;
