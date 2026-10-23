process.env.JWT_SECRET = process.env.JWT_SECRET || 'segredo_para_testes';

const { describe, test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const app = require('../main/BahguaAplication');
const {
    reiniciarRepositorios,
    criarUsuariosELogar,
    chamarApi,
    funcionarioService
} = require('./apoio');

describe('Módulo de Funcionário', () => {
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

    test('1. POST válido retorna 201, sem senha nem senhaHash, com ativo true', async () => {
        const res = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            nome: 'Carlos Souza',
            email: 'carlos@bahgua.com',
            senha: 'senhaSegura123',
            perfil: 'atendente'
        });

        assert.strictEqual(res.status, 201);
        assert.ok(res.dados.id);
        assert.strictEqual(res.dados.nome, 'Carlos Souza');
        assert.strictEqual(res.dados.email, 'carlos@bahgua.com');
        assert.strictEqual(res.dados.perfil, 'atendente');
        assert.strictEqual(res.dados.ativo, true);
        assert.strictEqual(res.dados.senha, undefined);
        assert.strictEqual(res.dados.senhaHash, undefined);
    });

    test('2.1. POST com nome ausente retorna 400', async () => {
        const res = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            email: 'semnome@bahgua.com',
            senha: 'senhaSegura123',
            perfil: 'atendente'
        });

        assert.strictEqual(res.status, 400);
        assert.ok(res.dados.erro);
    });

    test('2.2. POST com e-mail inválido retorna 400', async () => {
        const res = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            nome: 'Email Invalido',
            email: 'email-invalido',
            senha: 'senhaSegura123',
            perfil: 'atendente'
        });

        assert.strictEqual(res.status, 400);
        assert.ok(res.dados.erro);
    });

    test('2.3. POST com senha com 5 caracteres retorna 400', async () => {
        const res = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            nome: 'Senha Curta',
            email: 'curta@bahgua.com',
            senha: '12345',
            perfil: 'atendente'
        });

        assert.strictEqual(res.status, 400);
        assert.ok(res.dados.erro);
    });

    test('2.4. POST com perfil inválido retorna 400', async () => {
        const res = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            nome: 'Perfil Invalido',
            email: 'perfil@bahgua.com',
            senha: 'senhaSegura123',
            perfil: 'gerente'
        });

        assert.strictEqual(res.status, 400);
        assert.ok(res.dados.erro);
    });

    test('3. POST com e-mail repetido, inclusive com maiúsculas diferentes, retorna 409', async () => {
        const res1 = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            nome: 'João Silva',
            email: 'joao@email.com',
            senha: 'senhaSegura123',
            perfil: 'atendente'
        });
        assert.strictEqual(res1.status, 201);

        const resRepetido = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            nome: 'João Silva 2',
            email: 'joao@email.com',
            senha: 'senhaSegura123',
            perfil: 'atendente'
        });
        assert.strictEqual(resRepetido.status, 409);

        const resMaiusculas = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            nome: 'João Silva 3',
            email: 'JOAO@email.com',
            senha: 'senhaSegura123',
            perfil: 'atendente'
        });
        assert.strictEqual(resMaiusculas.status, 409);
    });

    test('4. GET /funcionarios lista sem senha nem senhaHash; ?perfil=atendente filtra; ?perfil=xyz retorna 400', async () => {
        const resLista = await chamarApi(porta, 'GET', '/funcionarios', usuarios.adminToken);
        assert.strictEqual(resLista.status, 200);
        assert.ok(Array.isArray(resLista.dados));
        assert.ok(resLista.dados.length >= 3);
        for (const f of resLista.dados) {
            assert.strictEqual(f.senha, undefined);
            assert.strictEqual(f.senhaHash, undefined);
            assert.ok(f.id);
            assert.ok(f.nome);
            assert.ok(f.email);
            assert.ok(f.perfil);
            assert.strictEqual(typeof f.ativo, 'boolean');
        }

        const resFiltro = await chamarApi(porta, 'GET', '/funcionarios?perfil=atendente', usuarios.adminToken);
        assert.strictEqual(resFiltro.status, 200);
        assert.ok(Array.isArray(resFiltro.dados));
        assert.ok(resFiltro.dados.length >= 1);
        for (const f of resFiltro.dados) {
            assert.strictEqual(f.perfil, 'atendente');
        }

        const resInvalido = await chamarApi(porta, 'GET', '/funcionarios?perfil=xyz', usuarios.adminToken);
        assert.strictEqual(resInvalido.status, 400);
        assert.ok(resInvalido.dados.erro);
    });

    test('5. GET /funcionarios/:id retorna 200; id inexistente retorna 404', async () => {
        const resExiste = await chamarApi(porta, 'GET', `/funcionarios/${usuarios.atendenteId}`, usuarios.adminToken);
        assert.strictEqual(resExiste.status, 200);
        assert.strictEqual(resExiste.dados.id, usuarios.atendenteId);
        assert.strictEqual(resExiste.dados.senha, undefined);
        assert.strictEqual(resExiste.dados.senhaHash, undefined);

        const resNaoExiste = await chamarApi(porta, 'GET', '/funcionarios/99999', usuarios.adminToken);
        assert.strictEqual(resNaoExiste.status, 404);
        assert.ok(resNaoExiste.dados.erro);
    });

    test('6. PUT altera nome e perfil mantendo senha; PUT com nova senha troca senha; PUT com 5 caracteres retorna 400; email duplicado retorna 409; id inexistente retorna 404', async () => {
        const cadRes = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, {
            nome: 'Func Teste PUT',
            email: 'func.put@bahgua.com',
            senha: 'senhaAntiga123',
            perfil: 'atendente'
        });
        const funcId = cadRes.dados.id;

        // 6a: Altera nome e perfil mantendo senha
        const putRes1 = await chamarApi(porta, 'PUT', `/funcionarios/${funcId}`, usuarios.adminToken, {
            nome: 'Func Teste PUT Modificado',
            email: 'func.put@bahgua.com',
            perfil: 'tecnico'
        });
        assert.strictEqual(putRes1.status, 200);
        assert.strictEqual(putRes1.dados.nome, 'Func Teste PUT Modificado');
        assert.strictEqual(putRes1.dados.perfil, 'tecnico');

        // Login com a senha antiga continua funcionando
        const loginAntiga = await chamarApi(porta, 'POST', '/auth/login', null, {
            email: 'func.put@bahgua.com',
            senha: 'senhaAntiga123'
        });
        assert.strictEqual(loginAntiga.status, 200);

        // 6b: PUT com nova senha troca a senha
        const putRes2 = await chamarApi(porta, 'PUT', `/funcionarios/${funcId}`, usuarios.adminToken, {
            nome: 'Func Teste PUT Modificado',
            email: 'func.put@bahgua.com',
            perfil: 'tecnico',
            senha: 'novaSenhaSegura123'
        });
        assert.strictEqual(putRes2.status, 200);

        // Login antigo falha
        const loginAntigaFalha = await chamarApi(porta, 'POST', '/auth/login', null, {
            email: 'func.put@bahgua.com',
            senha: 'senhaAntiga123'
        });
        assert.strictEqual(loginAntigaFalha.status, 401);

        // Novo login funciona
        const loginNova = await chamarApi(porta, 'POST', '/auth/login', null, {
            email: 'func.put@bahgua.com',
            senha: 'novaSenhaSegura123'
        });
        assert.strictEqual(loginNova.status, 200);

        // 6c: PUT com senha de 5 caracteres retorna 400
        const putCurta = await chamarApi(porta, 'PUT', `/funcionarios/${funcId}`, usuarios.adminToken, {
            nome: 'Func Teste PUT',
            email: 'func.put@bahgua.com',
            perfil: 'tecnico',
            senha: '12345'
        });
        assert.strictEqual(putCurta.status, 400);

        // 6d: E-mail de outro funcionário retorna 409
        const putEmailRepetido = await chamarApi(porta, 'PUT', `/funcionarios/${funcId}`, usuarios.adminToken, {
            nome: 'Func Teste PUT',
            email: 'admin.teste@bahgua.com',
            perfil: 'tecnico'
        });
        assert.strictEqual(putEmailRepetido.status, 409);

        // 6e: Id inexistente retorna 404
        const putInexistente = await chamarApi(porta, 'PUT', '/funcionarios/99999', usuarios.adminToken, {
            nome: 'Inexistente',
            email: 'inexistente@bahgua.com',
            perfil: 'tecnico'
        });
        assert.strictEqual(putInexistente.status, 404);
    });

    test('7. PATCH desativar e ativar alteram o campo ativo; id inexistente retorna 404', async () => {
        // Desativar atendente
        const desativarRes = await chamarApi(porta, 'PATCH', `/funcionarios/${usuarios.atendenteId}/desativar`, usuarios.adminToken);
        assert.strictEqual(desativarRes.status, 200);
        assert.strictEqual(desativarRes.dados.ativo, false);

        // Ativar atendente
        const ativarRes = await chamarApi(porta, 'PATCH', `/funcionarios/${usuarios.atendenteId}/ativar`, usuarios.adminToken);
        assert.strictEqual(ativarRes.status, 200);
        assert.strictEqual(ativarRes.dados.ativo, true);

        // Id inexistente
        const desativarInexistente = await chamarApi(porta, 'PATCH', '/funcionarios/99999/desativar', usuarios.adminToken);
        assert.strictEqual(desativarInexistente.status, 404);

        const ativarInexistente = await chamarApi(porta, 'PATCH', '/funcionarios/99999/ativar', usuarios.adminToken);
        assert.strictEqual(ativarInexistente.status, 404);
    });

    test('Super Admin: conta inicial protegida e somente seu titular pode editá-la', async () => {
        reiniciarRepositorios();
        const superAdmin = funcionarioService.criarAdministradorInicial();
        assert.strictEqual(superAdmin.superAdmin, true);
        const outro = funcionarioService.criar({ nome: 'Outro Admin', email: 'outro@example.com', senha: 'senhaAdmin123', perfil: 'administrador' });
        const login = await chamarApi(porta, 'POST', '/auth/login', null, { email: outro.email, senha: 'senhaAdmin123' });
        const token = login.dados.token;
        const desativar = await chamarApi(porta, 'PATCH', `/funcionarios/${superAdmin.id}/desativar`, token);
        assert.strictEqual(desativar.status, 403);
        const editar = await chamarApi(porta, 'PUT', `/funcionarios/${superAdmin.id}`, token, { nome: 'Invadido', email: superAdmin.email, perfil: 'administrador', senha: 'outraSenha123' });
        assert.strictEqual(editar.status, 403);
        const titular = funcionarioService.atualizar(superAdmin.id, { nome: 'Super Admin Atualizado', email: superAdmin.email, perfil: 'administrador' }, { id: superAdmin.id });
        assert.strictEqual(titular.superAdmin, true);
        assert.strictEqual(titular.ativo, true);
        assert.throws(() => funcionarioService.atualizar(superAdmin.id, { nome: titular.nome, email: titular.email, perfil: 'tecnico' }, { id: superAdmin.id }), { status: 403 });
    });

    test('Somente Super Admin pode criar ou promover administradores; flag enviada pelo cliente é ignorada', async () => {
        const dados = { nome: 'Novo Admin', email: 'novo.admin@example.com', senha: 'senhaAdmin123', perfil: 'administrador', superAdmin: true };
        const negado = await chamarApi(porta, 'POST', '/funcionarios', usuarios.adminToken, dados);
        assert.strictEqual(negado.status, 403);
        const promocao = await chamarApi(porta, 'PUT', `/funcionarios/${usuarios.atendenteId}`, usuarios.adminToken, { nome: 'Atendente', email: 'atendente.teste@bahgua.com', perfil: 'administrador' });
        assert.strictEqual(promocao.status, 403);
        reiniciarRepositorios();
        const inicial = funcionarioService.criarAdministradorInicial();
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: inicial.id }, process.env.JWT_SECRET);
        const criado = await chamarApi(porta, 'POST', '/funcionarios', token, dados);
        assert.strictEqual(criado.status, 201);
        assert.strictEqual(criado.dados.superAdmin, false);
        const comum = funcionarioService.criar({ nome: 'Atendente', email: 'promover@example.com', senha: 'senhaAdmin123', perfil: 'atendente' });
        const promovido = await chamarApi(porta, 'PUT', `/funcionarios/${comum.id}`, token, { nome: comum.nome, email: comum.email, perfil: 'administrador' });
        assert.strictEqual(promovido.status, 200);
        assert.strictEqual(promovido.dados.superAdmin, false);
    });

    test('8. verificarSenha: teste de unidade chamando funcionarioService diretamente', () => {
        const hash = funcionarioService.gerarHash('minhaSenhaCorreta123');
        assert.strictEqual(typeof hash, 'string');

        const resultadoCerto = funcionarioService.verificarSenha('minhaSenhaCorreta123', hash);
        assert.strictEqual(resultadoCerto, true);

        const resultadoErrado = funcionarioService.verificarSenha('senhaCompletamenteErrada', hash);
        assert.strictEqual(resultadoErrado, false);
    });
});
