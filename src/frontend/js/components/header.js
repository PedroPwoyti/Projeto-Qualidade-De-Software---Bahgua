/**
 * Componente da Barra Superior (Header) - Bahgua Telas
 * Exibe título, breadcrumbs, perfil autenticado e botão de logout.
 */

import { Icons } from './icons.js';
import { Auth } from '../services/auth.js';
import { Modal } from './modal.js';
import { CONFIG } from '../config.js';

export class Header {
    static render(title = 'Visão Geral', breadcrumb = 'Painel') {
        const user = Auth.getUser();
        const roleLabel = user ? (user.superAdmin ? 'Super Admin' : (CONFIG.ROLE_LABELS[user.perfil] || user.perfil)) : '';

        return `
            <header class="app-header">
                <div class="header-left">
                    <button type="button" class="sidebar-toggle-btn" id="sidebar-toggle-btn" aria-label="Abrir menu de navegação">
                        ${Icons.menu}
                    </button>
                    <div class="header-titles">
                        <div class="header-breadcrumbs">
                            <span class="breadcrumb-root">Sistema</span>
                            <span class="breadcrumb-separator">/</span>
                            <span class="breadcrumb-current">${breadcrumb}</span>
                        </div>
                        <h1 class="header-page-title">${title}</h1>
                    </div>
                </div>

                <div class="header-right">
                    <div class="user-profile-badge">
                        <div class="user-avatar-circle">
                            ${user ? user.nome.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="user-details-header">
                            <span class="user-full-name">${user ? user.nome : 'Usuário'}</span>
                            <span class="user-role-tag role-${user ? user.perfil : 'padrao'}">${roleLabel}</span>
                        </div>
                    </div>

                    <button type="button" class="btn-logout" id="btn-logout" title="Encerrar sessão">
                        <span class="logout-icon">${Icons.logout}</span>
                        <span class="logout-text">Sair</span>
                    </button>
                </div>
            </header>
        `;
    }

    static attachEvents() {
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('app-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        const logoutBtn = document.getElementById('btn-logout');

        if (toggleBtn && sidebar && backdrop) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                backdrop.classList.toggle('open');
            });
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Modal.confirm({
                    title: 'Encerrar Sessão',
                    message: 'Tem certeza de que deseja sair do sistema?',
                    confirmText: 'Sair da Conta',
                    cancelText: 'Permanecer',
                    danger: true,
                    onConfirm: () => {
                        Auth.logout();
                    }
                });
            });
        }
    }
}
