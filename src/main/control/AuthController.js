const authService = require('../service/AuthService');

class AuthController {
    login(req, res) {
        try {
            const { email, senha } = req.body || {};
            const resultado = authService.login(email, senha);
            return res.status(200).json(resultado);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao realizar login.' });
        }
    }
}

module.exports = new AuthController();
