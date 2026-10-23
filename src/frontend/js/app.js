/**
 * Controlador Principal e Roteador SPA - Bahgua Telas
 * Gerencia a navegação, layout administrativo, proteção de rotas e ciclo de vida das páginas.
 */

import { Auth } from './services/auth.js';
import { Sidebar } from './components/sidebar.js';
import { Header } from './components/header.js';
import { LoginView } from './views/loginView.js';
import { DashboardView } from './views/dashboardView.js';
import { ClientesView } from './views/clientesView.js';
import { FuncionariosView } from './views/funcionariosView.js';
import { PlanejadoView } from './views/planejadoView.js';

class App {
    constructor() {
        this.appRoot = document.getElementById('app');
        this.currentRoute = '';
        this.init();
    }

    init() {
        window.addEventListener('hashchange', () => this.navigate());
        window.addEventListener('load', () => this.navigate());

        // Atualiza interface caso o estado de autenticação mude
        Auth.onAuthChange(() => {
            this.navigate();
        });
    }

    async navigate() {
        let hash = window.location.hash || '#/dashboard';

        // Guarda de autenticação
        const isAuth = Auth.isAuthenticated();

        if (!isAuth) {
            if (hash !== '#/login') {
                window.location.hash = '#/login';
                return;
            }
            this.currentRoute = '#/login';
            this.renderLogin();
            return;
        }

        // Se autenticado e tentar ir para login, redireciona para dashboard
        if (hash === '#/login' || hash === '' || hash === '#/') {
            window.location.hash = '#/dashboard';
            return;
        }

        this.currentRoute = hash;
        await this.renderAppShell(hash);
    }

    renderLogin() {
        this.appRoot.innerHTML = LoginView.render();
        LoginView.attachEvents();
    }

    async renderAppShell(hash) {
        let title = 'Visão Geral';
        let breadcrumb = 'Painel';
        let viewHtml = '';
        let onMounted = null;

        if (hash === '#/dashboard') {
            title = 'Visão Geral';
            breadcrumb = 'Visão Geral';
            viewHtml = await DashboardView.render();
            onMounted = () => {
                DashboardView.loadData();
            };
        } else if (hash === '#/clientes') {
            title = 'Clientes';
            breadcrumb = 'Clientes';
            viewHtml = await ClientesView.render();
            onMounted = () => {
                ClientesView.attachEvents();
            };
        } else if (hash === '#/funcionarios') {
            title = 'Funcionários';
            breadcrumb = 'Funcionários';
            viewHtml = await FuncionariosView.render();
            onMounted = () => {
                FuncionariosView.attachEvents();
            };
        } else if (hash === '#/produtos') {
            title = 'Produtos & Peças';
            breadcrumb = 'Produtos';
            viewHtml = PlanejadoView.render('produtos');
        } else if (hash === '#/ordens-servico') {
            title = 'Ordens de Serviço';
            breadcrumb = 'Ordens de Serviço';
            viewHtml = PlanejadoView.render('ordens-servico');
        } else if (hash === '#/historico') {
            title = 'Histórico de Atendimentos';
            breadcrumb = 'Histórico';
            viewHtml = PlanejadoView.render('historico');
        } else if (hash === '#/configuracoes') {
            title = 'Configurações do Sistema';
            breadcrumb = 'Configurações';
            viewHtml = PlanejadoView.render('configuracoes');
        } else {
            // Rota não reconhecida
            window.location.hash = '#/dashboard';
            return;
        }

        this.appRoot.innerHTML = `
            <div class="app-layout">
                ${Sidebar.render(hash)}
                <div class="app-main-wrapper">
                    ${Header.render(title, breadcrumb)}
                    <main class="page-content" id="page-content">
                        ${viewHtml}
                    </main>
                </div>
            </div>
        `;

        Sidebar.attachEvents();
        Header.attachEvents();

        if (typeof onMounted === 'function') {
            onMounted();
        }
    }
}

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
