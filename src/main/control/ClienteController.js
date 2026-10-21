const clienteService = require('../service/ClienteService');

class ClienteController {
    listar(req, res) {
        return res.status(200).json(clienteService.listar());
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

    excluir(req, res) {
        const excluido = clienteService.excluir(req.params.id);
        if (!excluido) {
            return res.status(404).json({ erro: 'Cliente não encontrado.' });
        }
        return res.status(204).send();
    }
}

module.exports = new ClienteController();
