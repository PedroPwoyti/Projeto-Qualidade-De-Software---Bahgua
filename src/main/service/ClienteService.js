const clienteRepository = require('../repository/ClienteRepository');

class ClienteService {
    listar() {
        return clienteRepository.listar();
    }

    buscarPorId(id) {
        return clienteRepository.buscarPorId(id);
    }

    criar(dados) {
        this.validar(dados);
        return clienteRepository.criar(dados);
    }

    atualizar(id, dados) {
        this.validar(dados);
        return clienteRepository.atualizar(id, dados);
    }

    excluir(id) {
        return clienteRepository.excluir(id);
    }

    validar(dados) {
        const camposObrigatorios = ['nome', 'email', 'endereco'];
        for (const campo of camposObrigatorios) {
            if (typeof dados[campo] !== 'string' || !dados[campo].trim()) {
                const erro = new Error(`O campo '${campo}' é obrigatório e deve ser texto.`);
                erro.status = 400;
                throw erro;
            }
        }

        if (!Array.isArray(dados.telefones) ||
            !dados.telefones.every(telefone => typeof telefone === 'string' && telefone.trim())) {
            const erro = new Error("O campo 'telefones' deve ser uma lista de textos.");
            erro.status = 400;
            throw erro;
        }
    }
}

module.exports = new ClienteService();
