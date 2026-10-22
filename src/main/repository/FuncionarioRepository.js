const Funcionario = require('../entity/Funcionario');

// Repositório temporário em memória. Os dados são perdidos ao reiniciar o servidor.
class FuncionarioRepository {
    constructor() {
        this.funcionarios = [];
        this.proximoId = 1;
    }

    listar() {
        return [...this.funcionarios];
    }

    buscarPorId(id) {
        return this.funcionarios.find(funcionario => funcionario.id === Number(id)) || null;
    }

    buscarPorEmail(email) {
        if (typeof email !== 'string') return null;
        const emailMin = email.trim().toLowerCase();
        return this.funcionarios.find(funcionario => funcionario.email.toLowerCase() === emailMin) || null;
    }

    criar(dados) {
        const funcionario = new Funcionario({
            ...dados,
            id: this.proximoId++
        });
        this.funcionarios.push(funcionario);
        return funcionario;
    }

    atualizar(id, dados) {
        const indice = this.funcionarios.findIndex(funcionario => funcionario.id === Number(id));
        if (indice === -1) return null;

        const atual = this.funcionarios[indice];
        const atualizado = new Funcionario({
            id: atual.id,
            nome: dados.nome !== undefined ? dados.nome : atual.nome,
            email: dados.email !== undefined ? dados.email : atual.email,
            senhaHash: dados.senhaHash !== undefined ? dados.senhaHash : atual.senhaHash,
            perfil: dados.perfil !== undefined ? dados.perfil : atual.perfil,
            ativo: dados.ativo !== undefined ? dados.ativo : atual.ativo
        });
        this.funcionarios[indice] = atualizado;
        return atualizado;
    }
}

module.exports = new FuncionarioRepository();
