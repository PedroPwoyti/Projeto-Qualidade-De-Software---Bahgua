const clienteRepository = require('../repository/ClienteRepository');

class ClienteService {
    listar(filtros) {
        const { nome, telefone, cpfCnpj, incluirInativos } = filtros || {};

        let lista = clienteRepository.listar();

        if (incluirInativos !== 'true') {
            lista = lista.filter(cliente => cliente.ativo === true);
        }

        if (nome && typeof nome === 'string' && nome.trim()) {
            const termoNome = nome.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            lista = lista.filter(cliente => {
                const nomeCliente = cliente.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return nomeCliente.includes(termoNome);
            });
        }

        if (telefone && typeof telefone === 'string') {
            const termoTel = telefone.replace(/\D/g, '');
            if (termoTel.length > 0) {
                lista = lista.filter(cliente => {
                    return Array.isArray(cliente.telefones) && cliente.telefones.some(tel => {
                        return tel.replace(/\D/g, '').includes(termoTel);
                    });
                });
            }
        }

        if (cpfCnpj && typeof cpfCnpj === 'string') {
            const termoCpfCnpj = cpfCnpj.replace(/\D/g, '');
            if (termoCpfCnpj.length > 0) {
                lista = lista.filter(cliente => cliente.cpfCnpj === termoCpfCnpj);
            }
        }

        return lista;
    }

    buscarPorId(id) {
        return clienteRepository.buscarPorId(id);
    }

    criar(dados) {
        this.validar(dados, false);

        const cpfCnpjNorm = dados.cpfCnpj.replace(/\D/g, '');
        const existente = clienteRepository.buscarPorCpfCnpj(cpfCnpjNorm);
        if (existente) {
            const erro = new Error('CPF/CNPJ já cadastrado.');
            erro.status = 409;
            throw erro;
        }

        return clienteRepository.criar({
            nome: dados.nome.trim(),
            email: dados.email.trim(),
            endereco: dados.endereco.trim(),
            telefones: dados.telefones,
            cpfCnpj: cpfCnpjNorm,
            ativo: true
        });
    }

    atualizar(id, dados) {
        const atual = clienteRepository.buscarPorId(id);
        if (!atual) return null;

        this.validar(dados, true);

        const cpfCnpjNorm = dados.cpfCnpj.replace(/\D/g, '');
        const existente = clienteRepository.buscarPorCpfCnpj(cpfCnpjNorm);
        if (existente && existente.id !== Number(id)) {
            const erro = new Error('CPF/CNPJ já cadastrado.');
            erro.status = 409;
            throw erro;
        }

        return clienteRepository.atualizar(id, {
            nome: dados.nome.trim(),
            email: dados.email.trim(),
            endereco: dados.endereco.trim(),
            telefones: dados.telefones,
            cpfCnpj: cpfCnpjNorm
        });
    }

    ativar(id) {
        const atual = clienteRepository.buscarPorId(id);
        if (!atual) return null;

        return clienteRepository.atualizar(id, {
            nome: atual.nome,
            email: atual.email,
            endereco: atual.endereco,
            telefones: atual.telefones,
            cpfCnpj: atual.cpfCnpj,
            ativo: true
        });
    }

    desativar(id) {
        const atual = clienteRepository.buscarPorId(id);
        if (!atual) return null;

        return clienteRepository.atualizar(id, {
            nome: atual.nome,
            email: atual.email,
            endereco: atual.endereco,
            telefones: atual.telefones,
            cpfCnpj: atual.cpfCnpj,
            ativo: false
        });
    }

    validar(dados, isAtualizacao = false) {
        if (!dados || typeof dados !== 'object') {
            const erro = new Error('Dados inválidos para cliente.');
            erro.status = 400;
            throw erro;
        }

        const camposObrigatorios = ['nome', 'email', 'endereco', 'cpfCnpj'];
        for (const campo of camposObrigatorios) {
            if (typeof dados[campo] !== 'string' || !dados[campo].trim()) {
                const erro = new Error(`O campo '${campo}' é obrigatório e deve ser texto.`);
                erro.status = 400;
                throw erro;
            }
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(dados.email.trim())) {
            const erro = new Error('O campo \'email\' deve ter um formato válido.');
            erro.status = 400;
            throw erro;
        }

        if (!Array.isArray(dados.telefones) || dados.telefones.length < 1 ||
            !dados.telefones.every(t => typeof t === 'string' && t.trim())) {
            const erro = new Error('O campo \'telefones\' deve ser uma lista com pelo menos 1 item de texto não vazio.');
            erro.status = 400;
            throw erro;
        }

        const cpfCnpjDigitos = dados.cpfCnpj.replace(/\D/g, '');
        if (cpfCnpjDigitos.length !== 11 && cpfCnpjDigitos.length !== 14) {
            const erro = new Error('O campo \'cpfCnpj\' deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).');
            erro.status = 400;
            throw erro;
        }

        if (cpfCnpjDigitos.length === 11) {
            if (!this._validarCpf(cpfCnpjDigitos)) {
                const erro = new Error('CPF inválido.');
                erro.status = 400;
                throw erro;
            }
        } else {
            if (!this._validarCnpj(cpfCnpjDigitos)) {
                const erro = new Error('CNPJ inválido.');
                erro.status = 400;
                throw erro;
            }
        }
    }

    _validarCpf(cpf) {
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        let soma = 0;
        for (let i = 0; i < 9; i++) {
            soma += Number(cpf[i]) * (10 - i);
        }
        let resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== Number(cpf[9])) return false;

        soma = 0;
        for (let i = 0; i < 10; i++) {
            soma += Number(cpf[i]) * (11 - i);
        }
        resto = (soma * 10) % 11;
        if (resto === 10 || resto === 11) resto = 0;
        if (resto !== Number(cpf[10])) return false;

        return true;
    }

    _validarCnpj(cnpj) {
        if (/^(\d)\1{13}$/.test(cnpj)) return false;

        const calcDigito = (cnpj, tamanho) => {
            let soma = 0;
            let pos = tamanho - 7;
            for (let i = tamanho; i >= 1; i--) {
                soma += Number(cnpj[tamanho - i]) * pos--;
                if (pos < 2) pos = 9;
            }
            return soma % 11 < 2 ? 0 : 11 - (soma % 11);
        };

        const dig1 = calcDigito(cnpj, 12);
        if (dig1 !== Number(cnpj[12])) return false;

        const dig2 = calcDigito(cnpj, 13);
        if (dig2 !== Number(cnpj[13])) return false;

        return true;
    }
}

module.exports = new ClienteService();
