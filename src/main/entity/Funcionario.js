class Funcionario {
    constructor({ id = null, nome, email, senhaHash, perfil, ativo = true }) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.perfil = perfil;
        this.ativo = ativo;
    }
}

module.exports = Funcionario;