const clienteService = require('../service/ClienteService');

class ClienteController {
    listar(req, res) {
        try {
            const { nome, telefone, cpfCnpj, incluirInativos } = req.query;
            const clientes = clienteService.listar({ nome, telefone, cpfCnpj, incluirInativos });
            return res.status(200).json(clientes);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao listar clientes.' });
        }
    }

    buscarPorId(req, res) {
        const cliente = clienteService.buscarPorId(req.params.id);
        if (!cliente) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }
        return res.status(200).json(cliente);
    }

    criar(req, res) {
        try {
            const cliente = clienteService.criar(req.body);
            return res.status(201).json(cliente);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao criar cliente.' });
        }
    }

    atualizar(req, res) {
        try {
            const cliente = clienteService.atualizar(req.params.id, req.body);
            if (!cliente) {
                return res.status(404).json({ erro: 'Cliente não encontrado.' });
            }
            return res.status(200).json(cliente);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao atualizar cliente.' });
        }
    }

    ativar(req, res) {
        try {
            const cliente = clienteService.ativar(req.params.id);
            if (!cliente) {
                return res.status(404).json({ erro: 'Cliente não encontrado.' });
            }
            return res.status(200).json(cliente);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao ativar cliente.' });
        }
    }

    desativar(req, res) {
        try {
            const cliente = clienteService.desativar(req.params.id);
            if (!cliente) {
                return res.status(404).json({ erro: 'Cliente não encontrado.' });
            }
            return res.status(200).json(cliente);
        } catch (erro) {
            return res.status(erro.status || 500).json({ erro: erro.message || 'Erro ao desativar cliente.' });
        }
    }

    listarOrdens(req, res) {
        const cliente = clienteService.buscarPorId(req.params.id);
        if (!cliente) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }
        // TODO: ligar às ordens de serviço quando o módulo for implementado
        return res.status(200).json([]);
    }
}

module.exports = new ClienteController();
