/**
 * Tela de Visão Geral (Dashboard) - Bahgua Telas
 * Apresenta indicadores reais da API, atalhos rápidos e status do sistema.
 */

import { Api } from '../services/api.js';
import { Auth } from '../services/auth.js';
import { Icons } from '../components/icons.js';
import { Toast } from '../components/toast.js';

export class DashboardView {
    static async render() {
        const user = Auth.getUser();
        const isAdmin = Auth.hasRole('administrador');

        return `
            <div class="view-dashboard">
                <!-- Banner de Boas-vindas -->
                <div class="welcome-banner">
                    <div class="welcome-text">
                        <h2 class="welcome-title">Olá, ${user ? user.nome : 'Colaborador'}!</h2>
                        <p class="welcome-subtitle">
                            Painel de controle da assistência técnica Bahgua Telas. Acompanhe os registros e acesse as rotinas operacionais.
                        </p>
                    </div>
                    <div class="welcome-badge">
                        <span class="badge-dot"></span>
                        <span>API Conectada</span>
                    </div>
                </div>

                <!-- Grade de Indicadores (KPIs) -->
                <div class="stats-grid">
                    <!-- Total de Clientes -->
                    <div class="stat-card" id="card-total-clientes">
                        <div class="stat-icon-wrapper icon-blue">
                            ${Icons.clientes}
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Clientes Cadastrados</span>
                            <span class="stat-value" id="stat-clientes-total">
                                <span class="loading-pulse">...</span>
                            </span>
                            <span class="stat-footnote" id="stat-clientes-subtext">Carregando dados da API...</span>
                        </div>
                    </div>

                    <!-- Clientes Ativos -->
                    <div class="stat-card" id="card-clientes-ativos">
                        <div class="stat-icon-wrapper icon-green">
                            ${Icons.check}
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Clientes Ativos</span>
                            <span class="stat-value" id="stat-clientes-ativos">
                                <span class="loading-pulse">...</span>
                            </span>
                            <span class="stat-footnote" id="stat-clientes-ativos-subtext">Aguardando contagem...</span>
                        </div>
                    </div>

                    <!-- Equipe de Funcionários -->
                    <div class="stat-card" id="card-equipe">
                        <div class="stat-icon-wrapper icon-navy">
                            ${Icons.funcionarios}
                        </div>
                        <div class="stat-content">
                            <span class="stat-label">Equipe Cadastrada</span>
                            <span class="stat-value" id="stat-funcionarios-total">
                                ${isAdmin ? '<span class="loading-pulse">...</span>' : 'Restrito'}
                            </span>
                            <span class="stat-footnote" id="stat-funcionarios-subtext">
                                ${isAdmin ? 'Consultando equipe...' : 'Visualização restrita ao Administrador'}
                            </span>
                        </div>
                    </div>

                    <!-- Ordens de Serviço (Planejado) -->
                    <div class="stat-card stat-card-planned" id="card-ordens-planejado">
                        <div class="stat-icon-wrapper icon-gray">
                            ${Icons.ordens}
                        </div>
                        <div class="stat-content">
                            <div class="stat-header-row">
                                <span class="stat-label">Ordens de Serviço</span>
                                <span class="planned-tag">Módulo Planejado</span>
                            </div>
                            <span class="stat-value stat-value-pending">Pendente</span>
                            <span class="stat-footnote">Backend em fase de planejamento</span>
                        </div>
                    </div>
                </div>

                <!-- Painéis Centrais: Ações Rápidas & Clientes Recentes -->
                <div class="dashboard-panels-grid">
                    <!-- Ações Rápidas -->
                    <div class="panel-card">
                        <div class="panel-header">
                            <h3 class="panel-title">
                                <span class="panel-title-icon">${Icons.tools}</span>
                                Ações Rápidas
                            </h3>
                        </div>
                        <div class="panel-body">
                            <div class="quick-actions-list">
                                <a href="#/clientes" class="quick-action-btn">
                                    <div class="action-btn-icon">${Icons.clientes}</div>
                                    <div class="action-btn-content">
                                        <strong>Consultar Clientes</strong>
                                        <span>Pesquise por nome, telefone ou CPF/CNPJ</span>
                                    </div>
                                    <span class="action-btn-arrow">&rarr;</span>
                                </a>

                                ${isAdmin ? `
                                    <a href="#/funcionarios" class="quick-action-btn">
                                        <div class="action-btn-icon">${Icons.funcionarios}</div>
                                        <div class="action-btn-content">
                                            <strong>Gerenciar Funcionários</strong>
                                            <span>Cadastre atendentes, técnicos e administradores</span>
                                        </div>
                                        <span class="action-btn-arrow">&rarr;</span>
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Últimos Clientes Cadastrados -->
                    <div class="panel-card">
                        <div class="panel-header">
                            <h3 class="panel-title">
                                <span class="panel-title-icon">${Icons.clientes}</span>
                                Clientes Recentes
                            </h3>
                            <a href="#/clientes" class="panel-header-link">Ver todos &rarr;</a>
                        </div>
                        <div class="panel-body">
                            <div id="recent-clients-container">
                                <div class="loading-state-box">
                                    <div class="spinner"></div>
                                    <span>Carregando clientes...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static async loadData() {
        const isAdmin = Auth.hasRole('administrador');

        // Carrega clientes da API
        try {
            const clientes = await Api.getClientes({ incluirInativos: true });
            const total = clientes.length;
            const ativos = clientes.filter(c => c.ativo).length;

            const totalEl = document.getElementById('stat-clientes-total');
            const subtextEl = document.getElementById('stat-clientes-subtext');
            const ativosEl = document.getElementById('stat-clientes-ativos');
            const ativosSubtextEl = document.getElementById('stat-clientes-ativos-subtext');

            if (totalEl) totalEl.textContent = total;
            if (subtextEl) subtextEl.textContent = `${total} registro(s) no sistema`;
            if (ativosEl) ativosEl.textContent = ativos;
            if (ativosSubtextEl) ativosSubtextEl.textContent = `${ativos} apto(s) para atendimento`;

            // Renderiza tabela recente
            const recentContainer = document.getElementById('recent-clients-container');
            if (recentContainer) {
                if (clientes.length === 0) {
                    recentContainer.innerHTML = `
                        <div class="empty-state-box">
                            <div class="empty-icon">${Icons.clientes}</div>
                            <h4>Nenhum cliente cadastrado</h4>
                            <p>Comece adicionando seu primeiro cliente no menu Clientes.</p>
                            <a href="#/clientes" class="btn btn-sm btn-primary">Ir para Clientes</a>
                        </div>
                    `;
                } else {
                    const ultimos = clientes.slice(-5).reverse();
                    recentContainer.innerHTML = `
                        <div class="table-responsive">
                            <table class="data-table table-condensed">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Telefone</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${ultimos.map(c => `
                                        <tr>
                                            <td><strong>${this._escape(c.nome)}</strong></td>
                                            <td>${this._escape(c.telefones && c.telefones[0] ? c.telefones[0] : '-')}</td>
                                            <td>
                                                <span class="badge ${c.ativo ? 'badge-ativo' : 'badge-inativo'}">
                                                    ${c.ativo ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('Erro ao carregar clientes no dashboard:', err);
            const totalEl = document.getElementById('stat-clientes-total');
            if (totalEl) totalEl.textContent = 'Erro';
            const recentContainer = document.getElementById('recent-clients-container');
            if (recentContainer) {
                recentContainer.innerHTML = `
                    <div class="alert alert-danger">
                        ${Icons.alertTriangle} Falha ao carregar lista de clientes da API.
                    </div>
                `;
            }
        }

        // Se administrador, carrega contagem de funcionários
        if (isAdmin) {
            try {
                const funcionarios = await Api.getFuncionarios();
                const totalFunc = funcionarios.length;
                const ativosFunc = funcionarios.filter(f => f.ativo).length;

                const funcTotalEl = document.getElementById('stat-funcionarios-total');
                const funcSubtextEl = document.getElementById('stat-funcionarios-subtext');

                if (funcTotalEl) funcTotalEl.textContent = totalFunc;
                if (funcSubtextEl) funcSubtextEl.textContent = `${ativosFunc} ativo(s) de ${totalFunc} cadastrado(s)`;
            } catch (err) {
                console.error('Erro ao carregar equipe no dashboard:', err);
                const funcTotalEl = document.getElementById('stat-funcionarios-total');
                if (funcTotalEl) funcTotalEl.textContent = 'Erro';
            }
        }
    }

    static _escape(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
