const { test } = require('node:test');
const assert = require('node:assert/strict');
const criarDadosIniciais = require('../main/service/DadosIniciaisService');
const funcionarios = require('../main/repository/FuncionarioRepository');
const clientes = require('../main/repository/ClienteRepository');
const funcionarioService = require('../main/service/FuncionarioService');
const clienteService = require('../main/service/ClienteService');

test('Inicialização cria Super Admin, dois funcionários e três clientes sem duplicar ou redefinir dados', () => {
    funcionarios.reiniciar();
    clientes.reiniciar();
    criarDadosIniciais();
    assert.equal(funcionarios.listar().length, 3);
    assert.equal(funcionarios.listar().filter(f => f.superAdmin).length, 1);
    for (const [email, perfil, senha] of [
        ['atendente@bahgua.com', 'atendente', 'atendente123'],
        ['tecnico@bahgua.com', 'tecnico', 'tecnico123']
    ]) {
        const funcionario = funcionarios.buscarPorEmail(email);
        assert.equal(funcionario.perfil, perfil);
        assert.equal(funcionario.superAdmin, false);
        assert.equal(funcionarioService.verificarSenha(senha, funcionario.senhaHash), true);
    }
    assert.equal(clienteService.listar().length, 3);
    const cliente = clientes.listar()[0];
    clienteService.desativar(cliente.id);
    const atendente = funcionarios.buscarPorEmail('atendente@bahgua.com');
    funcionarioService.desativar(atendente.id);
    criarDadosIniciais();
    assert.equal(funcionarios.listar().length, 3);
    assert.equal(clientes.listar().length, 3);
    assert.equal(clientes.buscarPorId(cliente.id).ativo, false);
    assert.equal(funcionarios.buscarPorId(atendente.id).ativo, false);
});
