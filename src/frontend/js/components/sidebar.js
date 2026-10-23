/**
 * Componente do Menu Lateral (Sidebar) - Bahgua Telas
 * Fundo azul-marinho (#304356), navegação ativa, identificação de módulos e suporte responsivo.
 */

import { Icons } from './icons.js';
import { Auth } from '../services/auth.js';

export class Sidebar {
    static render(currentRoute = '') {
        const user = Auth.getUser();
        const isAdmin = Auth.hasRole('administrador');

        const navItems = [
            {
                id: 'dashboard',
                hash: '#/dashboard',
                label: 'Visão Geral',
                icon: Icons.dashboard,
                badge: null,
                visible: true
            },
            {
                id: 'clientes',
                hash: '#/clientes',
                label: 'Clientes',
                icon: Icons.clientes,
                badge: null,
                visible: true
            },
            {
                id: 'funcionarios',
                hash: '#/funcionarios',
                label: 'Funcionários',
                icon: Icons.funcionarios,
                badge: isAdmin ? null : 'Restrito',
                badgeClass: 'badge-sidebar-restricted',
                visible: true
            },
            {
                id: 'produtos',
                hash: '#/produtos',
                label: 'Produtos',
                icon: Icons.produtos,
                badge: 'Planejado',
                badgeClass: 'badge-sidebar-planned',
                visible: true
            },
            {
                id: 'ordens-servico',
                hash: '#/ordens-servico',
                label: 'Ordens de Serviço',
                icon: Icons.ordens,
                badge: 'Planejado',
                badgeClass: 'badge-sidebar-planned',
                visible: true
            },
            {
                id: 'historico',
                hash: '#/historico',
                label: 'Histórico',
                icon: Icons.historico,
                badge: 'Planejado',
                badgeClass: 'badge-sidebar-planned',
                visible: true
            },
            {
                id: 'configuracoes',
                hash: '#/configuracoes',
                label: 'Configurações',
                icon: Icons.configuracoes,
                badge: 'Planejado',
                badgeClass: 'badge-sidebar-planned',
                visible: true
            }
        ];

        return `
            <aside class="app-sidebar" id="app-sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-brand">
                        <div class="brand-icon-box">
                            ${Icons.logo}
                        </div>
                        <div class="brand-text">
                            <span class="brand-title">Bahgua Telas</span>
                            <span class="brand-subtitle">Assistência Técnica</span>
                        </div>
                    </div>
                    <button type="button" class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Fechar menu">
                        ${Icons.close}
                    </button>
                </div>

                <nav class="sidebar-nav">
                    <div class="nav-section-title">Navegação Principal</div>
                    <ul class="nav-list">
                        ${navItems.filter(item => item.visible).map(item => {
                            const isActive = currentRoute === item.hash || (item.id === 'dashboard' && currentRoute === '');
                            return `
                                <li class="nav-item">
                                    <a href="${item.hash}" class="nav-link ${isActive ? 'active' : ''}" data-route="${item.id}">
                                        <span class="nav-icon">${item.icon}</span>
                                        <span class="nav-label">${item.label}</span>
                                        ${item.badge ? `<span class="sidebar-badge ${item.badgeClass || ''}">${item.badge}</span>` : ''}
                                    </a>
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </nav>

                <div class="sidebar-footer">
                    <div class="sidebar-user-card">
                        <div class="user-avatar-placeholder">
                            ${user ? user.nome.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="user-info-sidebar">
                            <span class="user-name-sidebar">${user ? user.nome : 'Usuário'}</span>
                            <span class="user-role-badge badge-${user ? user.perfil : 'user'}">${user ? (user.superAdmin ? 'Super Admin' : user.perfil) : ''}</span>
                        </div>
                    </div>
                </div>
            </aside>
            <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
        `;
    }

    static attachEvents() {
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const closeBtn = document.getElementById('sidebar-close-btn');

        const closeSidebar = () => {
            if (sidebar) sidebar.classList.remove('open');
            if (backdrop) backdrop.classList.remove('open');
        };

        if (backdrop) backdrop.addEventListener('click', closeSidebar);
        if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    }
}
