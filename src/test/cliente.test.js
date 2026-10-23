process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo_para_testes';

const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const app = require('../main/BahguaAplication');
const {
    reiniciarRepositorios,
    criarUsuariosELogar,
    chamarApi
} = require('./apoio');

describe('Módulo de Cliente', () => {
    let server;
    let porta;
    let usuarios;

    before(() => {
        server = app.listen(0);
        porta = server.address().port;
    });

    after(() => {
        server.close();
    });

    beforeEach(async () => {
        usuarios = await criarUsuariosELogar(porta);
    });

    function criarCorpoCliente(sobrescrever = {}) {
        return {
            nome: 'Cliente Padrão',
            email: 'cliente.padrao@email.com',
            endereco: 'Rua das Palmeiras, 100',
            telefones: ['(42) 99999-0000', '(42) 3222-1111'],
            cpfCnpj: '529.982.247-25',
            ...sobrescrever
        };
    }

    test('1. POST válido retorna 201, com cpfCnpj normalizado (só dígitos) e ativo true; vários telefones aceitos', async () => {
        const corpo = criarCorpoCliente({
            nome: 'Carlos Drummond',
            email: 'carlos.drummond@email.com',
            endereco: 'Rua Itabira, 200',
            telefones: ['(42) 99999-0000', '(42) 3222-1111', '(11) 98888-7777'],
            cpfCnpj: '529.982.247-25'
        });

        const res = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, corpo);
        assert.strictEqual(res.status, 201);
        assert.ok(res.dados.id);
        assert.strictEqual(res.dados.nome, 'Carlos Drummond');
        assert.strictEqual(res.dados.email, 'carlos.drummond@email.com');
        assert.strictEqual(res.dados.cpfCnpj, '52998224725');
        assert.strictEqual(res.dados.ativo, true);
        assert.strictEqual(Array.isArray(res.dados.telefones), true);
        assert.strictEqual(res.dados.telefones.length, 3);
    });

    test('2. POST retorna 400 para erros de validação; CNPJ válido retorna 201 com dígitos normalizados', async () => {
        // telefones []
        const resTelefonesVazio = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            telefones: []
        }));
        assert.strictEqual(resTelefonesVazio.status, 400);

        // telefones ausente
        const corpoSemTelefones = criarCorpoCliente();
        delete corpoSemTelefones.telefones;
        const resSemTelefones = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, corpoSemTelefones);
        assert.strictEqual(resSemTelefones.status, 400);

        // endereco ausente
        const corpoSemEndereco = criarCorpoCliente();
        delete corpoSemEndereco.endereco;
        const resSemEndereco = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, corpoSemEndereco);
        assert.strictEqual(resSemEndereco.status, 400);

        // email inválido
        const resEmailInvalido = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            email: 'emailinvalido'
        }));
        assert.strictEqual(resEmailInvalido.status, 400);

        // CPF com dígito verificador errado
        const resCpfDigitoErrado = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            cpfCnpj: '52998224726'
        }));
        assert.strictEqual(resCpfDigitoErrado.status, 400);

        // CPF com todos os dígitos repetidos
        const resCpfRepetido = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            cpfCnpj: '11111111111'
        }));
        assert.strictEqual(resCpfRepetido.status, 400);

        // POST com CNPJ válido (11.222.333/0001-81) retorna 201 e cpfCnpj só com dígitos
        const resCnpj = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            nome: 'Empresa Teste LTDA',
            email: 'contato@empresa.com',
            cpfCnpj: '11.222.333/0001-81'
        }));
        assert.strictEqual(resCnpj.status, 201);
        assert.strictEqual(resCnpj.dados.cpfCnpj, '11222333000181');
        assert.strictEqual(resCnpj.dados.ativo, true);
    });

    test('3. POST com o mesmo CPF, com e sem pontuação, retorna 409', async () => {
        const res1 = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            email: 'cliente1@email.com',
            cpfCnpj: '529.982.247-25'
        }));
        assert.strictEqual(res1.status, 201);

        // Mesmo CPF sem pontuação
        const res2 = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            email: 'cliente2@email.com',
            cpfCnpj: '52998224725'
        }));
        assert.strictEqual(res2.status, 409);

        // Mesmo CPF com pontuação
        const res3 = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            email: 'cliente3@email.com',
            cpfCnpj: '529.982.247-25'
        }));
        assert.strictEqual(res3.status, 409);
    });

    test('4. PUT válido retorna 200 e preserva ativo; PUT com CPF de outro retorna 409; mantendo próprio CPF retorna 200; id inexistente retorna 404', async () => {
        const res1 = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            email: 'cliente1@email.com',
            cpfCnpj: '529.982.247-25'
        }));
        assert.strictEqual(res1.status, 201);
        const id1 = res1.dados.id;

        const res2 = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            nome: 'Cliente Dois',
            email: 'cliente2@email.com',
            cpfCnpj: '111.444.777-35'
        }));
        assert.strictEqual(res2.status, 201);

        // Desativa o cliente 1
        const desativarRes = await chamarApi(porta, 'PATCH', `/clientes/${id1}/desativar`, usuarios.adminToken);
        assert.strictEqual(desativarRes.status, 200);
        assert.strictEqual(desativarRes.dados.ativo, false);

        // PUT válido com corpo contendo ativo: true (deve preservar ativo: false)
        const putValido = await chamarApi(porta, 'PUT', `/clientes/${id1}`, usuarios.adminToken, {
            nome: 'Cliente Um Atualizado',
            email: 'cliente1.atualizado@email.com',
            endereco: 'Nova Rua, 50',
            telefones: ['(42) 99999-0000'],
            cpfCnpj: '529.982.247-25',
            ativo: true
        });
        assert.strictEqual(putValido.status, 200);
        assert.strictEqual(putValido.dados.nome, 'Cliente Um Atualizado');
        assert.strictEqual(putValido.dados.ativo, false);

        // PUT com CPF de outro cliente retorna 409
        const putConflito = await chamarApi(porta, 'PUT', `/clientes/${id1}`, usuarios.adminToken, {
            nome: 'Cliente Um Atualizado',
            email: 'cliente1.atualizado@email.com',
            endereco: 'Nova Rua, 50',
            telefones: ['(42) 99999-0000'],
            cpfCnpj: '111.444.777-35'
        });
        assert.strictEqual(putConflito.status, 409);

        // PUT mantendo o próprio CPF/CNPJ retorna 200
        const putMesmoCpf = await chamarApi(porta, 'PUT', `/clientes/${id1}`, usuarios.adminToken, {
            nome: 'Cliente Um Com Mesmo CPF',
            email: 'cliente1.atualizado@email.com',
            endereco: 'Nova Rua, 50',
            telefones: ['(42) 99999-0000'],
            cpfCnpj: '52998224725'
        });
        assert.strictEqual(putMesmoCpf.status, 200);
        assert.strictEqual(putMesmoCpf.dados.nome, 'Cliente Um Com Mesmo CPF');

        // PUT em id inexistente retorna 404
        const putInexistente = await chamarApi(porta, 'PUT', '/clientes/99999', usuarios.adminToken, {
            nome: 'Inexistente',
            email: 'inexistente@email.com',
            endereco: 'Rua X, 0',
            telefones: ['(42) 99999-0000'],
            cpfCnpj: '390.533.447-05'
        });
        assert.strictEqual(putInexistente.status, 404);
    });

    test('5. DELETE /clientes/:id retorna 404 (rota removida)', async () => {
        const res = await chamarApi(porta, 'DELETE', '/clientes/1', usuarios.adminToken);
        assert.strictEqual(res.status, 404);
    });

    test('6. Busca por filtros: ?nome, ?telefone, ?cpfCnpj, combinações e busca sem resultados', async () => {
        // Cadastra Maria
        const resMaria = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, {
            nome: 'Maria da Silva',
            email: 'maria@email.com',
            endereco: 'Rua das Flores, 10',
            telefones: ['(42) 99999-0000', '(42) 3222-1111'],
            cpfCnpj: '529.982.247-25'
        });
        assert.strictEqual(resMaria.status, 201);
        const mariaId = resMaria.dados.id;

        // Cadastra José
        const resJose = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, {
            nome: 'José Santos',
            email: 'jose@email.com',
            endereco: 'Avenida Brasil, 20',
            telefones: ['(42) 98888-2222', '(42) 3444-5555'],
            cpfCnpj: '111.444.777-35'
        });
        assert.strictEqual(resJose.status, 201);
        const joseId = resJose.dados.id;

        // ?nome=maria (minúsculas) encontra Maria
        const buscaMaria = await chamarApi(porta, 'GET', '/clientes?nome=maria', usuarios.adminToken);
        assert.strictEqual(buscaMaria.status, 200);
        assert.strictEqual(buscaMaria.dados.some(c => c.id === mariaId), true);
        assert.strictEqual(buscaMaria.dados.some(c => c.id === joseId), false);

        // ?nome=jose encontra José (sem acento)
        const buscaJose = await chamarApi(porta, 'GET', '/clientes?nome=jose', usuarios.adminToken);
        assert.strictEqual(buscaJose.status, 200);
        assert.strictEqual(buscaJose.dados.some(c => c.id === joseId), true);
        assert.strictEqual(buscaJose.dados.some(c => c.id === mariaId), false);

        // ?telefone=3222 encontra Maria pelo segundo telefone
        const buscaTel2 = await chamarApi(porta, 'GET', '/clientes?telefone=3222', usuarios.adminToken);
        assert.strictEqual(buscaTel2.status, 200);
        assert.strictEqual(buscaTel2.dados.some(c => c.id === mariaId), true);
        assert.strictEqual(buscaTel2.dados.some(c => c.id === joseId), false);

        // ?telefone=(42)99999 (com pontuação) encontra Maria
        const buscaTelPont = await chamarApi(porta, 'GET', '/clientes?telefone=(42)99999', usuarios.adminToken);
        assert.strictEqual(buscaTelPont.status, 200);
        assert.strictEqual(buscaTelPont.dados.some(c => c.id === mariaId), true);

        // ?cpfCnpj=529.982.247-25 encontra Maria
        const buscaCpf = await chamarApi(porta, 'GET', '/clientes?cpfCnpj=529.982.247-25', usuarios.adminToken);
        assert.strictEqual(buscaCpf.status, 200);
        assert.strictEqual(buscaCpf.dados.some(c => c.id === mariaId), true);
        assert.strictEqual(buscaCpf.dados.some(c => c.id === joseId), false);

        // Combinação de filtros atendida
        const buscaCombinaOk = await chamarApi(porta, 'GET', '/clientes?nome=maria&telefone=3222', usuarios.adminToken);
        assert.strictEqual(buscaCombinaOk.status, 200);
        assert.strictEqual(buscaCombinaOk.dados.length, 1);
        assert.strictEqual(buscaCombinaOk.dados[0].id, mariaId);

        // Combinação de filtros conflitante
        const buscaCombinaFalha = await chamarApi(porta, 'GET', '/clientes?nome=maria&telefone=3444', usuarios.adminToken);
        assert.strictEqual(buscaCombinaFalha.status, 200);
        assert.deepStrictEqual(buscaCombinaFalha.dados, []);

        // Filtro sem resultado
        const buscaVazia = await chamarApi(porta, 'GET', '/clientes?nome=inexistente', usuarios.adminToken);
        assert.strictEqual(buscaVazia.status, 200);
        assert.deepStrictEqual(buscaVazia.dados, []);
    });

    test('7. PATCH desativar: cliente some de GET /clientes mas aparece em ?incluirInativos=true; PATCH ativar o traz de volta; 404 em id inexistente', async () => {
        const res = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            cpfCnpj: '529.982.247-25'
        }));
        assert.strictEqual(res.status, 201);
        const clienteId = res.dados.id;

        // Desativar cliente
        const desativarRes = await chamarApi(porta, 'PATCH', `/clientes/${clienteId}/desativar`, usuarios.adminToken);
        assert.strictEqual(desativarRes.status, 200);
        assert.strictEqual(desativarRes.dados.ativo, false);

        // Some da listagem padrão
        const listagemPadrao = await chamarApi(porta, 'GET', '/clientes', usuarios.adminToken);
        assert.strictEqual(listagemPadrao.status, 200);
        assert.strictEqual(listagemPadrao.dados.some(c => c.id === clienteId), false);

        // Aparece com ?incluirInativos=true
        const listagemComInativos = await chamarApi(porta, 'GET', '/clientes?incluirInativos=true', usuarios.adminToken);
        assert.strictEqual(listagemComInativos.status, 200);
        assert.strictEqual(listagemComInativos.dados.some(c => c.id === clienteId && c.ativo === false), true);

        // Ativar cliente
        const ativarRes = await chamarApi(porta, 'PATCH', `/clientes/${clienteId}/ativar`, usuarios.adminToken);
        assert.strictEqual(ativarRes.status, 200);
        assert.strictEqual(ativarRes.dados.ativo, true);

        // Volta à listagem padrão
        const listagemReativada = await chamarApi(porta, 'GET', '/clientes', usuarios.adminToken);
        assert.strictEqual(listagemReativada.status, 200);
        assert.strictEqual(listagemReativada.dados.some(c => c.id === clienteId && c.ativo === true), true);

        // 404 em id inexistente
        const desativarInexistente = await chamarApi(porta, 'PATCH', '/clientes/99999/desativar', usuarios.adminToken);
        assert.strictEqual(desativarInexistente.status, 404);

        const ativarInexistente = await chamarApi(porta, 'PATCH', '/clientes/99999/ativar', usuarios.adminToken);
        assert.strictEqual(ativarInexistente.status, 404);
    });

    test('8. GET /clientes/:id/ordens retorna 200 e []; id inexistente retorna 404; técnico também recebe 200', async () => {
        const res = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            cpfCnpj: '529.982.247-25'
        }));
        assert.strictEqual(res.status, 201);
        const clienteId = res.dados.id;

        // Atendente recebe 200 e []
        const resAtendente = await chamarApi(porta, 'GET', `/clientes/${clienteId}/ordens`, usuarios.atendenteToken);
        assert.strictEqual(resAtendente.status, 200);
        assert.deepStrictEqual(resAtendente.dados, []);

        // Técnico também recebe 200 e []
        const resTecnico = await chamarApi(porta, 'GET', `/clientes/${clienteId}/ordens`, usuarios.tecnicoToken);
        assert.strictEqual(resTecnico.status, 200);
        assert.deepStrictEqual(resTecnico.dados, []);

        // Id inexistente retorna 404
        const resInexistente = await chamarApi(porta, 'GET', '/clientes/99999/ordens', usuarios.adminToken);
        assert.strictEqual(resInexistente.status, 404);
    });

    test('9. Regressão: GET /clientes/:id retorna 200 para id existente e 404 para inexistente', async () => {
        const res = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, criarCorpoCliente({
            cpfCnpj: '529.982.247-25'
        }));
        assert.strictEqual(res.status, 201);
        const clienteId = res.dados.id;

        const resExiste = await chamarApi(porta, 'GET', `/clientes/${clienteId}`, usuarios.adminToken);
        assert.strictEqual(resExiste.status, 200);
        assert.strictEqual(resExiste.dados.id, clienteId);

        const resInexistente = await chamarApi(porta, 'GET', '/clientes/99999', usuarios.adminToken);
        assert.strictEqual(resInexistente.status, 404);
    });
});
