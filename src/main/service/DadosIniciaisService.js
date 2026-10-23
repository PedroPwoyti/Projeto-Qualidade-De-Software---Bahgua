const funcionarioService = require('./FuncionarioService');
const clienteService = require('./ClienteService');
const funcionarioRepository = require('../repository/FuncionarioRepository');
const clienteRepository = require('../repository/ClienteRepository');

function criarDadosIniciais() {
    funcionarioService.criarAdministradorInicial();

    const funcionarios = [
        { nome: 'Mariana Santos', email: 'atendente@bahgua.com', senha: 'atendente123', perfil: 'atendente' },
        { nome: 'Lucas Oliveira', email: 'tecnico@bahgua.com', senha: 'tecnico123', perfil: 'tecnico' }
    ];

    for (const funcionario of funcionarios) {
        if (!funcionarioRepository.buscarPorEmail(funcionario.email)) {
            funcionarioService.criar(funcionario);
        }
    }

    // Cadastros fictícios para demonstração do sistema.
    const clientes = [
        { nome: 'Ana Souza', email: 'ana@example.com', endereco: 'Rua das Flores, 100', telefones: ['(42) 99999-1001'], cpfCnpj: '52998224725' },
        { nome: 'Bruno Lima', email: 'bruno@example.com', endereco: 'Avenida Central, 200', telefones: ['(42) 99999-1002'], cpfCnpj: '11144477735' },
        { nome: 'Carla Ferreira', email: 'carla@example.com', endereco: 'Rua das Palmeiras, 300', telefones: ['(42) 99999-1003'], cpfCnpj: '12345678909' }
    ];

    for (const cliente of clientes) {
        if (!clienteRepository.buscarPorCpfCnpj(cliente.cpfCnpj)) {
            clienteService.criar(cliente);
        }
    }
}

module.exports = criarDadosIniciais;
