const funcionarioService = require('../service/FuncionarioService');

class FuncionarioController {
    listar(req, res) {
        try {
            const { perfil } = req.query;
            const funcionarios = funcionarioService.listar(perfil);
            return res.status(200).json(funcionarios);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao listar funcionários.' });
        }
    }

    buscarPorId(req, res) {
        const funcionario = funcionarioService.buscarPorId(req.params.id);
        if (!funcionario) {
            return res.status(404).json({ erro: 'Funcionário não encontrado.' });
        }
        return res.status(200).json(funcionario);
    }

    criar(req, res) {
        try {
            const funcionario = funcionarioService.criar(req.body);
            return res.status(201).json(funcionario);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao criar funcionário.' });
        }
    }

    atualizar(req, res) {
        try {
            if (req.usuario && Number(req.usuario.id) === Number(req.params.id)) {
                if (req.body && req.body.perfil && req.body.perfil !== 'administrador') {
                    return res.status(400).json({ erro: 'Um administrador não pode alterar o próprio perfil.' });
                }
            }
            const funcionario = funcionarioService.atualizar(req.params.id, req.body);
            if (!funcionario) {
                return res.status(404).json({ erro: 'Funcionário não encontrado.' });
            }
            return res.status(200).json(funcionario);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao atualizar funcionário.' });
        }
    }

    ativar(req, res) {
        try {
            const funcionario = funcionarioService.ativar(req.params.id);
            if (!funcionario) {
                return res.status(404).json({ erro: 'Funcionário não encontrado.' });
            }
            return res.status(200).json(funcionario);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao ativar funcionário.' });
        }
    }

    desativar(req, res) {
        try {
            if (req.usuario && Number(req.usuario.id) === Number(req.params.id)) {
                return res.status(400).json({ erro: 'Um administrador não pode desativar a si mesmo.' });
            }
            const funcionario = funcionarioService.desativar(req.params.id);
            if (!funcionario) {
                return res.status(404).json({ erro: 'Funcionário não encontrado.' });
            }
            return res.status(200).json(funcionario);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao desativar funcionário.' });
        }
    }
}

module.exports = new FuncionarioController();
