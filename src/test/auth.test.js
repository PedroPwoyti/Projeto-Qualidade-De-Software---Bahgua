process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo_para_testes';

const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const app = require('../main/BahguaAplication');
const {
    reiniciarRepositorios,
    criarUsuariosELogar,
    chamarApi
} = require('./apoio');

describe('Autenticação e Controle de Acesso', () => {
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

    test('1. Login do administrador retorna 200 com token e sem senha nem senhaHash', async () => {
        const res = await chamarApi(porta, 'POST', '/auth/login', null, {
            email: 'admin.teste@bahgua.com',
            senha: 'senhaAdmin123'
        });

        assert.strictEqual(res.status, 200);
        assert.ok(res.dados.token);
        assert.strictEqual(typeof res.dados.token, 'string');
        assert.ok(res.dados.funcionario);
        assert.strictEqual(res.dados.funcionario.email, 'admin.teste@bahgua.com');
        assert.strictEqual(res.dados.funcionario.perfil, 'administrador');
        assert.strictEqual(res.dados.funcionario.senha, undefined);
        assert.strictEqual(res.dados.funcionario.senhaHash, undefined);
    });

    test('2. Login com senha errada e com e-mail inexistente retornam 401 com a mesma mensagem', async () => {
        const resSenhaErrada = await chamarApi(porta, 'POST', '/auth/login', null, {
            email: 'admin.teste@bahgua.com',
            senha: 'senhaTotalmenteIncorreta'
        });
        assert.strictEqual(resSenhaErrada.status, 401);
        assert.ok(resSenhaErrada.dados.erro);

        const resEmailInexistente = await chamarApi(porta, 'POST', '/auth/login', null, {
            email: 'naoexiste@bahgua.com',
            senha: 'senhaAdmin123'
        });
        assert.strictEqual(resEmailInexistente.status, 401);
        assert.ok(resEmailInexistente.dados.erro);

        assert.strictEqual(resSenhaErrada.dados.erro, resEmailInexistente.dados.erro);
    });

    test('3. Login de funcionário desativado retorna 403', async () => {
        const desativarRes = await chamarApi(porta, 'PATCH', `/funcionarios/${usuarios.atendenteId}/desativar`, usuarios.adminToken);
        assert.strictEqual(desativarRes.status, 200);

        const loginRes = await chamarApi(porta, 'POST', '/auth/login', null, {
            email: 'atendente.teste@bahgua.com',
            senha: 'senhaAtendente123'
        });
        assert.strictEqual(loginRes.status, 403);
        assert.ok(loginRes.dados.erro);
    });

    test('4. Rotas protegidas sem token, com token inválido e sem o prefixo Bearer retornam 401', async () => {
        const semToken = await chamarApi(porta, 'GET', '/clientes', null);
        assert.strictEqual(semToken.status, 401);

        const tokenInvalido = await chamarApi(porta, 'GET', '/clientes', 'tokenInvalido12345');
        assert.strictEqual(tokenInvalido.status, 401);

        // Sem prefixo Bearer: passar header manual via fetch
        const resSemBearer = await fetch(`http://localhost:${porta}/clientes`, {
            headers: {
                'Authorization': usuarios.adminToken
            }
        });
        assert.strictEqual(resSemBearer.status, 401);
    });

    test('5. Atendente e técnico em GET /funcionarios recebem 403; administrador recebe 200', async () => {
        const resAtendente = await chamarApi(porta, 'GET', '/funcionarios', usuarios.atendenteToken);
        assert.strictEqual(resAtendente.status, 403);

        const resTecnico = await chamarApi(porta, 'GET', '/funcionarios', usuarios.tecnicoToken);
        assert.strictEqual(resTecnico.status, 403);

        const resAdmin = await chamarApi(porta, 'GET', '/funcionarios', usuarios.adminToken);
        assert.strictEqual(resAdmin.status, 200);
    });

    test('6. Atendente: GET, POST e PUT em /clientes funcionam (200, 201, 200)', async () => {
        const resGet = await chamarApi(porta, 'GET', '/clientes', usuarios.atendenteToken);
        assert.strictEqual(resGet.status, 200);

        const resPost = await chamarApi(porta, 'POST', '/clientes', usuarios.atendenteToken, {
            nome: 'Cliente do Atendente',
            email: 'cliente.atendente@email.com',
            endereco: 'Rua Central, 100',
            telefones: ['(42) 99999-1234'],
            cpfCnpj: '529.982.247-25'
        });
        assert.strictEqual(resPost.status, 201);
        const clienteId = resPost.dados.id;

        const resPut = await chamarApi(porta, 'PUT', `/clientes/${clienteId}`, usuarios.atendenteToken, {
            nome: 'Cliente do Atendente Alterado',
            email: 'cliente.atendente@email.com',
            endereco: 'Rua Central, 100',
            telefones: ['(42) 99999-1234'],
            cpfCnpj: '529.982.247-25'
        });
        assert.strictEqual(resPut.status, 200);
    });

    test('7. Técnico: GET /clientes retorna 200; POST, PUT e PATCH em /clientes retornam 403', async () => {
        // Cria cliente inicial com admin
        const clienteCriado = await chamarApi(porta, 'POST', '/clientes', usuarios.adminToken, {
            nome: 'Cliente para Teste Técnico',
            email: 'cliente.tecnico@email.com',
            endereco: 'Rua do Tecnico, 50',
            telefones: ['(42) 98888-0000'],
            cpfCnpj: '529.982.247-25'
        });
        assert.strictEqual(clienteCriado.status, 201);
        const clienteId = clienteCriado.dados.id;

        // Técnico GET -> 200
        const resGet = await chamarApi(porta, 'GET', '/clientes', usuarios.tecnicoToken);
        assert.strictEqual(resGet.status, 200);

        // Técnico POST -> 403
        const resPost = await chamarApi(porta, 'POST', '/clientes', usuarios.tecnicoToken, {
            nome: 'Outro Cliente',
            email: 'outro@email.com',
            endereco: 'Rua Nova, 1',
            telefones: ['(42) 91111-2222'],
            cpfCnpj: '111.444.777-35'
        });
        assert.strictEqual(resPost.status, 403);

        // Técnico PUT -> 403
        const resPut = await chamarApi(porta, 'PUT', `/clientes/${clienteId}`, usuarios.tecnicoToken, {
            nome: 'Cliente Alterado por Tecnico',
            email: 'cliente.tecnico@email.com',
            endereco: 'Rua do Tecnico, 50',
            telefones: ['(42) 98888-0000'],
            cpfCnpj: '529.982.247-25'
        });
        assert.strictEqual(resPut.status, 403);

        // Técnico PATCH desativar -> 403
        const resDesativar = await chamarApi(porta, 'PATCH', `/clientes/${clienteId}/desativar`, usuarios.tecnicoToken);
        assert.strictEqual(resDesativar.status, 403);

        // Técnico PATCH ativar -> 403
        const resAtivar = await chamarApi(porta, 'PATCH', `/clientes/${clienteId}/ativar`, usuarios.tecnicoToken);
        assert.strictEqual(resAtivar.status, 403);
    });

    test('8. Administrador não consegue desativar a si mesmo (400); consegue desativar outro (200)', async () => {
        const resDesativarSi = await chamarApi(porta, 'PATCH', `/funcionarios/${usuarios.adminId}/desativar`, usuarios.adminToken);
        assert.strictEqual(resDesativarSi.status, 400);
        assert.ok(resDesativarSi.dados.erro);

        const resDesativarOutro = await chamarApi(porta, 'PATCH', `/funcionarios/${usuarios.atendenteId}/desativar`, usuarios.adminToken);
        assert.strictEqual(resDesativarOutro.status, 200);
        assert.strictEqual(resDesativarOutro.dados.ativo, false);
    });

    test('9. Revalidação: atendente faz GET /clientes (200); admin desativa; MESMO token retorna 403; admin reativa; MESMO token retorna 200', async () => {
        // Atendente acessa com sucesso
        const res1 = await chamarApi(porta, 'GET', '/clientes', usuarios.atendenteToken);
        assert.strictEqual(res1.status, 200);

        // Admin desativa o atendente
        const desativar = await chamarApi(porta, 'PATCH', `/funcionarios/${usuarios.atendenteId}/desativar`, usuarios.adminToken);
        assert.strictEqual(desativar.status, 200);

        // O MESMO token agora retorna 403
        const res2 = await chamarApi(porta, 'GET', '/clientes', usuarios.atendenteToken);
        assert.strictEqual(res2.status, 403);

        // Admin reativa o atendente
        const reativar = await chamarApi(porta, 'PATCH', `/funcionarios/${usuarios.atendenteId}/ativar`, usuarios.adminToken);
        assert.strictEqual(reativar.status, 200);

        // O MESMO token volta a retornar 200
        const res3 = await chamarApi(porta, 'GET', '/clientes', usuarios.atendenteToken);
        assert.strictEqual(res3.status, 200);
    });

    test('10. Revalidação de perfil: atendente com token válido; admin altera perfil para tecnico via PUT; com MESMO token, POST /clientes retorna 403 e GET /clientes retorna 200', async () => {
        // Admin altera perfil do atendente para 'tecnico'
        const putRes = await chamarApi(porta, 'PUT', `/funcionarios/${usuarios.atendenteId}`, usuarios.adminToken, {
            nome: 'Atendente Teste',
            email: 'atendente.teste@bahgua.com',
            perfil: 'tecnico'
        });
        assert.strictEqual(putRes.status, 200);

        // Com o MESMO token antigo do atendente:
        // POST /clientes deve ser negado (403) porque seu perfil agora é técnico
        const resPost = await chamarApi(porta, 'POST', '/clientes', usuarios.atendenteToken, {
            nome: 'Tentativa Cliente',
            email: 'tentativa@email.com',
            endereco: 'Rua X, 10',
            telefones: ['(42) 99999-8888'],
            cpfCnpj: '529.982.247-25'
        });
        assert.strictEqual(resPost.status, 403);

        // GET /clientes deve ser permitido (200) pois técnico tem permissão para listar
        const resGet = await chamarApi(porta, 'GET', '/clientes', usuarios.atendenteToken);
        assert.strictEqual(resGet.status, 200);
    });

    test('11. Token assinado com o JWT_SECRET correto, mas com id inexistente (999999), retorna 401', async () => {
        const tokenOrfao = jwt.sign(
            { id: 999999, perfil: 'administrador' },
            process.env.JWT_SECRET
        );

        const res = await chamarApi(porta, 'GET', '/clientes', tokenOrfao);
        assert.strictEqual(res.status, 401);
        assert.ok(res.dados.erro);
    });

    test('12. Administrador desativando a si mesmo com id puro (/funcionarios/<id>/desativar) e com zero à esquerda (/funcionarios/0<id>/desativar) retorna 400 nos dois', async () => {
        const resIdPuro = await chamarApi(porta, 'PATCH', `/funcionarios/${usuarios.adminId}/desativar`, usuarios.adminToken);
        assert.strictEqual(resIdPuro.status, 400);
        assert.ok(resIdPuro.dados.erro);

        const resZeroEsquerda = await chamarApi(porta, 'PATCH', `/funcionarios/0${usuarios.adminId}/desativar`, usuarios.adminToken);
        assert.strictEqual(resZeroEsquerda.status, 400);
        assert.ok(resZeroEsquerda.dados.erro);
    });

    test('13. Administrador mudando o PRÓPRIO perfil para atendente via PUT retorna 400; atualizar o próprio nome via PUT retorna 200', async () => {
        // Tentando mudar próprio perfil para atendente -> 400
        const resMudarPerfil = await chamarApi(porta, 'PUT', `/funcionarios/${usuarios.adminId}`, usuarios.adminToken, {
            nome: 'Administrador Teste',
            email: 'admin.teste@bahgua.com',
            perfil: 'atendente'
        });
        assert.strictEqual(resMudarPerfil.status, 400);
        assert.ok(resMudarPerfil.dados.erro);

        // Atualizando o próprio nome mantendo perfil administrador -> 200
        const resMudarNome = await chamarApi(porta, 'PUT', `/funcionarios/${usuarios.adminId}`, usuarios.adminToken, {
            nome: 'Administrador Nome Atualizado',
            email: 'admin.teste@bahgua.com',
            perfil: 'administrador'
        });
        assert.strictEqual(resMudarNome.status, 200);
        assert.strictEqual(resMudarNome.dados.nome, 'Administrador Nome Atualizado');
    });

    test('14. Token expirado é rejeitado com 401', async () => {
        const tokenExpirado = jwt.sign(
            { id: usuarios.adminId, perfil: 'administrador' },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '-1s' }
        );

        const res = await chamarApi(porta, 'GET', '/clientes', tokenExpirado);
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.dados.erro, 'Token inválido ou expirado.');
    });

    test('15. Token assinado com outro segredo é rejeitado com 401', async () => {
        const tokenOutroSegredo = jwt.sign(
            { id: usuarios.adminId, perfil: 'administrador' },
            'outro_segredo_invalido_123',
            { algorithm: 'HS256', expiresIn: '1h' }
        );

        const res = await chamarApi(porta, 'GET', '/clientes', tokenOutroSegredo);
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.dados.erro, 'Token inválido ou expirado.');
    });

    test('16. Usuário comum (atendente) não consegue alterar próprio perfil para administrador (elevação de privilégio bloqueada com 403)', async () => {
        const res = await chamarApi(porta, 'PUT', `/funcionarios/${usuarios.atendenteId}`, usuarios.atendenteToken, {
            nome: 'Atendente Invasor',
            email: 'atendente.teste@bahgua.com',
            perfil: 'administrador'
        });
        assert.strictEqual(res.status, 403);
    });

    test('17. Servidor falha com código 1 e mensagem clara ao iniciar sem JWT_SECRET', () => {
        const { spawnSync } = require('child_process');
        const path = require('path');
        const scriptPath = path.resolve(__dirname, '../main/BahguaAplication.js');
        const resultado = spawnSync(process.execPath, [scriptPath], {
            env: { ...process.env, JWT_SECRET: '' },
            encoding: 'utf-8'
        });

        assert.strictEqual(resultado.status, 1);
        const saida = (resultado.stderr || '') + (resultado.stdout || '');
        assert.ok(saida.includes('Erro: A variável de ambiente JWT_SECRET é obrigatória para iniciar o servidor.'));
    });
});
