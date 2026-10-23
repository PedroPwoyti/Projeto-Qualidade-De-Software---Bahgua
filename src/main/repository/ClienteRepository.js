const Cliente = require('../entity/Cliente');

// Repositório temporário em memória. Os dados são perdidos ao reiniciar o servidor.
class ClienteRepository {
    constructor() {
        this.clientes = [];
        this.proximoId = 1;
    }

    reiniciar() {
        this.clientes = [];
        this.proximoId = 1;
    }

    listar() {
        return [...this.clientes];
    }

    buscarPorId(id) {
        return this.clientes.find(cliente => cliente.id === Number(id)) || null;
    }

    buscarPorCpfCnpj(cpfCnpj) {
        return this.clientes.find(cliente => cliente.cpfCnpj === cpfCnpj) || null;
    }

    criar(dados) {
        const cliente = new Cliente({
            ...dados,
            id: this.proximoId++
        });
        this.clientes.push(cliente);
        return cliente;
    }

    atualizar(id, dados) {
        const indice = this.clientes.findIndex(cliente => cliente.id === Number(id));
        if (indice === -1) return null;

        const atual = this.clientes[indice];
        const atualizado = new Cliente({
            id: atual.id,
            nome: dados.nome !== undefined ? dados.nome : atual.nome,
            email: dados.email !== undefined ? dados.email : atual.email,
            endereco: dados.endereco !== undefined ? dados.endereco : atual.endereco,
            telefones: dados.telefones !== undefined ? dados.telefones : atual.telefones,
            cpfCnpj: dados.cpfCnpj !== undefined ? dados.cpfCnpj : atual.cpfCnpj,
            ativo: dados.ativo !== undefined ? dados.ativo : atual.ativo
        });
        this.clientes[indice] = atualizado;
        return atualizado;
    }
}

module.exports = new ClienteRepository();
