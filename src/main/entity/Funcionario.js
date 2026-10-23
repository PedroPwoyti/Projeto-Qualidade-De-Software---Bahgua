class Funcionario {
    constructor({ id = null, nome, email, senhaHash, perfil, ativo = true, superAdmin = false }) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senhaHash = senhaHash;
        this.perfil = perfil;
        this.ativo = ativo;
        this.superAdmin = superAdmin;
    }
}

module.exports = Funcionario;
