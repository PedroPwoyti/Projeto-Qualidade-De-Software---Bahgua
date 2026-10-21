const express = require('express');
const ClienteController = require('./control/ClienteController');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rotas de Cliente
app.get('/clientes', ClienteController.listar);
app.get('/clientes/:id', ClienteController.buscarPorId);
app.post('/clientes', ClienteController.criar);
app.put('/clientes/:id', ClienteController.atualizar);
app.delete('/clientes/:id', ClienteController.excluir);

// Tratamento básico para rotas inexistentes
app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' });
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
}

module.exports = app;