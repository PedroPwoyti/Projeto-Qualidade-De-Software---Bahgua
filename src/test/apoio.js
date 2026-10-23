const funcionarioRepository = require('../main/repository/FuncionarioRepository');
const clienteRepository = require('../main/repository/ClienteRepository');
const funcionarioService = require('../main/service/FuncionarioService');

function reiniciarRepositorios() {
    funcionarioRepository.reiniciar();
    clienteRepository.reiniciar();
}

async function chamarApi(porta, metodo, caminho, token = null, corpo = null) {
    let p, m, c, t, b;
    if (typeof porta === 'object' && porta !== null) {
        p = porta.porta;
        m = porta.metodo || 'GET';
        c = porta.caminho;
        t = porta.token || null;
        b = porta.corpo !== undefined ? porta.corpo : null;
    } else {
        p = porta;
        m = metodo || 'GET';
        c = caminho;
        t = token || null;
        b = corpo !== undefined ? corpo : null;
    }

    const url = `http://localhost:${p}${c}`;
    const headers = {};

    if (b !== null) {
        headers['Content-Type'] = 'application/json';
    }
    if (t) {
        headers['Authorization'] = `Bearer ${t}`;
    }

    const opcoes = {
        method: m,
        headers
    };

    if (b !== null) {
        opcoes.body = typeof b === 'string' ? b : JSON.stringify(b);
    }

    const resposta = await fetch(url, opcoes);
    let dados = null;
    const contentType = resposta.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        try {
            dados = await resposta.json();
        } catch {
            dados = null;
        }
    } else {
        const texto = await resposta.text();
        try {
            dados = JSON.parse(texto);
        } catch {
            dados = texto;
        }
    }

    return {
        status: resposta.status,
        dados
    };
}

async function criarUsuariosELogar(porta) {
    reiniciarRepositorios();

    const adminCriado = funcionarioService.criar({
        nome: 'Administrador Teste',
        email: 'admin.teste@bahgua.com',
        senha: 'senhaAdmin123',
        perfil: 'administrador'
    });

    const atendenteCriado = funcionarioService.criar({
        nome: 'Atendente Teste',
        email: 'atendente.teste@bahgua.com',
        senha: 'senhaAtendente123',
        perfil: 'atendente'
    });

    const tecnicoCriado = funcionarioService.criar({
        nome: 'Tecnico Teste',
        email: 'tecnico.teste@bahgua.com',
        senha: 'senhaTecnico123',
        perfil: 'tecnico'
    });

    const loginAdmin = await chamarApi(porta, 'POST', '/auth/login', null, {
        email: 'admin.teste@bahgua.com',
        senha: 'senhaAdmin123'
    });

    const loginAtendente = await chamarApi(porta, 'POST', '/auth/login', null, {
        email: 'atendente.teste@bahgua.com',
        senha: 'senhaAtendente123'
    });

    const loginTecnico = await chamarApi(porta, 'POST', '/auth/login', null, {
        email: 'tecnico.teste@bahgua.com',
        senha: 'senhaTecnico123'
    });

    return {
        admin: {
            id: adminCriado.id,
            token: loginAdmin.dados.token
        },
        atendente: {
            id: atendenteCriado.id,
            token: loginAtendente.dados.token
        },
        tecnico: {
            id: tecnicoCriado.id,
            token: loginTecnico.dados.token
        },
        adminId: adminCriado.id,
        adminToken: loginAdmin.dados.token,
        atendenteId: atendenteCriado.id,
        atendenteToken: loginAtendente.dados.token,
        tecnicoId: tecnicoCriado.id,
        tecnicoToken: loginTecnico.dados.token
    };
}

module.exports = {
    reiniciarRepositorios,
    criarUsuariosELogar,
    chamarApi,
    funcionarioRepository,
    clienteRepository,
    funcionarioService
};
