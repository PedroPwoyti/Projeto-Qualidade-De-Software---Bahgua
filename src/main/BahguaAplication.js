const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const express = require('express');
const AuthController = require('./control/AuthController');
const ClienteController = require('./control/ClienteController');
const FuncionarioController = require('./control/FuncionarioController');
const criarDadosIniciais = require('./service/DadosIniciaisService');
const autenticar = require('./middleware/autenticar');
const autorizar = require('./middleware/autorizar');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Suporte a CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Arquivos estáticos do Frontend
app.use(express.static(path.resolve(__dirname, '../frontend')));

// Rotas de Autenticação
app.post('/auth/login', AuthController.login);

// Rotas de Cliente
app.get('/clientes', autenticar, autorizar('administrador', 'atendente', 'tecnico'), ClienteController.listar);
app.post('/clientes', autenticar, autorizar('administrador', 'atendente'), ClienteController.criar);
app.get('/clientes/:id/ordens', autenticar, autorizar('administrador', 'atendente', 'tecnico'), ClienteController.listarOrdens);
app.get('/clientes/:id', autenticar, autorizar('administrador', 'atendente', 'tecnico'), ClienteController.buscarPorId);
app.put('/clientes/:id', autenticar, autorizar('administrador', 'atendente'), ClienteController.atualizar);
app.patch('/clientes/:id/ativar', autenticar, autorizar('administrador', 'atendente'), ClienteController.ativar);
app.patch('/clientes/:id/desativar', autenticar, autorizar('administrador', 'atendente'), ClienteController.desativar);

// Rotas de Funcionário
app.get('/funcionarios', autenticar, autorizar('administrador'), FuncionarioController.listar);
app.get('/funcionarios/:id', autenticar, autorizar('administrador'), FuncionarioController.buscarPorId);
app.post('/funcionarios', autenticar, autorizar('administrador'), FuncionarioController.criar);
app.put('/funcionarios/:id', autenticar, autorizar('administrador'), FuncionarioController.atualizar);
app.patch('/funcionarios/:id/ativar', autenticar, autorizar('administrador'), FuncionarioController.ativar);
app.patch('/funcionarios/:id/desativar', autenticar, autorizar('administrador'), FuncionarioController.desativar);

// Tratamento básico para rotas inexistentes
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
});

if (require.main === module) {
    if (!process.env.JWT_SECRET) {
        console.error('Erro: A variável de ambiente JWT_SECRET é obrigatória para iniciar o servidor.');
        process.exit(1);
    }
    criarDadosIniciais();
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;
