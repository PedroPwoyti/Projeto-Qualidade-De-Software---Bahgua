const crypto = require('crypto');
const funcionarioRepository = require('../repository/FuncionarioRepository');

class FuncionarioService {
    listar(perfil) {
        const perfisValidos = ['atendente', 'tecnico', 'administrador'];
        if (perfil) {
            if (!perfisValidos.includes(perfil)) {
                const erro = new Error('Perfil inválido para filtro. Valores permitidos: atendente, tecnico, administrador.');
                erro.status = 400;
                throw erro;
            }
            return funcionarioRepository.listar()
                .filter(funcionario => funcionario.perfil === perfil)
                .map(funcionario => this._formatarResposta(funcionario));
        }
        return funcionarioRepository.listar()
            .map(funcionario => this._formatarResposta(funcionario));
    }

    buscarPorId(id) {
        const funcionario = funcionarioRepository.buscarPorId(id);
        return this._formatarResposta(funcionario);
    }

    criar(dados) {
        this.validar(dados, false);

        const existente = funcionarioRepository.buscarPorEmail(dados.email);
        if (existente) {
            const erro = new Error('Já existe um funcionário cadastrado com este e-mail.');
            erro.status = 409;
            throw erro;
        }

        const senhaHash = this.gerarHash(dados.senha);
        const funcionario = funcionarioRepository.criar({
            nome: dados.nome.trim(),
            email: dados.email.trim(),
            senhaHash,
            perfil: dados.perfil,
            ativo: true
        });

        return this._formatarResposta(funcionario);
    }

    atualizar(id, dados) {
        const atual = funcionarioRepository.buscarPorId(id);
        if (!atual) return null;

        this.validar(dados, true);

        const existente = funcionarioRepository.buscarPorEmail(dados.email);
        if (existente && existente.id !== Number(id)) {
            const erro = new Error('Já existe outro funcionário cadastrado com este e-mail.');
            erro.status = 409;
            throw erro;
        }

        const dadosAtualizacao = {
            nome: dados.nome.trim(),
            email: dados.email.trim(),
            perfil: dados.perfil
        };

        if (dados.senha && typeof dados.senha === 'string' && dados.senha.length >= 8) {
            dadosAtualizacao.senhaHash = this.gerarHash(dados.senha);
        }

        const atualizado = funcionarioRepository.atualizar(id, dadosAtualizacao);
        return this._formatarResposta(atualizado);
    }

    ativar(id) {
        const atual = funcionarioRepository.buscarPorId(id);
        if (!atual) return null;

        const atualizado = funcionarioRepository.atualizar(id, { ativo: true });
        return this._formatarResposta(atualizado);
    }

    desativar(id) {
        const atual = funcionarioRepository.buscarPorId(id);
        if (!atual) return null;

        const atualizado = funcionarioRepository.atualizar(id, { ativo: false });
        return this._formatarResposta(atualizado);
    }

    validar(dados, isAtualizacao = false) {
        if (!dados || typeof dados !== 'object') {
            const erro = new Error('Dados inválidos para funcionário.');
            erro.status = 400;
            throw erro;
        }

        if (typeof dados.nome !== 'string' || !dados.nome.trim()) {
            const erro = new Error('O campo \'nome\' é obrigatório e deve ser texto.');
            erro.status = 400;
            throw erro;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof dados.email !== 'string' || !dados.email.trim() || !emailRegex.test(dados.email.trim())) {
            const erro = new Error('O campo \'email\' é obrigatório e deve ter um formato válido.');
            erro.status = 400;
            throw erro;
        }

        const perfisValidos = ['atendente', 'tecnico', 'administrador'];
        if (!dados.perfil || !perfisValidos.includes(dados.perfil)) {
            const erro = new Error('O campo \'perfil\' é inválido. Valores permitidos: atendente, tecnico, administrador.');
            erro.status = 400;
            throw erro;
        }

        if (!isAtualizacao) {
            if (typeof dados.senha !== 'string' || dados.senha.length < 8) {
                const erro = new Error('O campo \'senha\' é obrigatório e deve ter no mínimo 8 caracteres.');
                erro.status = 400;
                throw erro;
            }
        } else {
            if (dados.senha !== undefined && dados.senha !== null && dados.senha !== '') {
                if (typeof dados.senha !== 'string' || dados.senha.length < 8) {
                    const erro = new Error('O campo \'senha\' deve ter no mínimo 8 caracteres.');
                    erro.status = 400;
                    throw erro;
                }
            }
        }
    }

    gerarHash(senha) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.scryptSync(senha, salt, 64).toString('hex');
        return `${salt}:${hash}`;
    }

    verificarSenha(senha, hash) {
        if (!senha || !hash || typeof hash !== 'string') return false;
        const partes = hash.split(':');
        if (partes.length !== 2) return false;
        const [salt, hashOriginal] = partes;
        const hashCalculado = crypto.scryptSync(senha, salt, 64).toString('hex');
        const bufCalculado = Buffer.from(hashCalculado, 'hex');
        const bufOriginal = Buffer.from(hashOriginal, 'hex');
        if (bufCalculado.length !== bufOriginal.length) return false;
        return crypto.timingSafeEqual(bufCalculado, bufOriginal);
    }

    criarAdministradorInicial() {
        const existeAdmin = funcionarioRepository.listar().some(f => f.perfil === 'administrador');
        if (existeAdmin) {
            return null;
        }

        const nome = process.env.ADMIN_NOME;
        const email = process.env.ADMIN_EMAIL;
        const senha = process.env.ADMIN_SENHA;

        if (!nome || !email || !senha) {
            return null;
        }

        const existenteEmail = funcionarioRepository.buscarPorEmail(email);
        if (existenteEmail) {
            return null;
        }

        const senhaHash = this.gerarHash(senha);
        const admin = funcionarioRepository.criar({
            nome: nome.trim(),
            email: email.trim(),
            senhaHash,
            perfil: 'administrador',
            ativo: true
        });

        return this.formatarResposta(admin);
    }

    formatarResposta(funcionario) {
        if (!funcionario) return null;
        return {
            id: funcionario.id,
            nome: funcionario.nome,
            email: funcionario.email,
            perfil: funcionario.perfil,
            ativo: funcionario.ativo
        };
    }

    _formatarResposta(funcionario) {
        return this.formatarResposta(funcionario);
    }
}

module.exports = new FuncionarioService();
