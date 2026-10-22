const jwt = require('jsonwebtoken');
const funcionarioRepository = require('../repository/FuncionarioRepository');
const funcionarioService = require('./FuncionarioService');

class AuthService {
    login(email, senha) {
        if (!email || !senha || typeof email !== 'string' || typeof senha !== 'string') {
            const erro = new Error('Credenciais inválidas.');
            erro.status = 401;
            throw erro;
        }

        const funcionario = funcionarioRepository.buscarPorEmail(email);
        if (!funcionario) {
            const erro = new Error('Credenciais inválidas.');
            erro.status = 401;
            throw erro;
        }

        const senhaValida = funcionarioService.verificarSenha(senha, funcionario.senhaHash);
        if (!senhaValida) {
            const erro = new Error('Credenciais inválidas.');
            erro.status = 401;
            throw erro;
        }

        if (!funcionario.ativo) {
            const erro = new Error('Funcionário inativo. Acesso negado.');
            erro.status = 403;
            throw erro;
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            const erro = new Error('JWT_SECRET não configurado.');
            erro.status = 500;
            throw erro;
        }

        const token = jwt.sign(
            { id: funcionario.id, perfil: funcionario.perfil },
            jwtSecret,
            { expiresIn: '8h' }
        );

        return {
            token,
            funcionario: funcionarioService.formatarResposta(funcionario)
        };
    }
}

module.exports = new AuthService();
