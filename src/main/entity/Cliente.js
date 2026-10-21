class Cliente {
    constructor({ id = null, nome, email, endereco, telefones = [] }) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.endereco = endereco;
        this.telefones = telefones;
    }
}

module.exports = Cliente;