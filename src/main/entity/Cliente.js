class Cliente {
    constructor({ id = null, nome, email, endereco, telefones = [], cpfCnpj, ativo = true }) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.endereco = endereco;
        this.telefones = telefones;
        this.cpfCnpj = cpfCnpj;
        this.ativo = ativo;
    }
}

module.exports = Cliente;