/**
 * Componente Reutilizável de Modal - Bahgua Telas
 * Suporte a modais dinâmicos, formulários, visualização e caixas de confirmação acessíveis.
 */

import { Icons } from './icons.js';

class ModalManager {
    constructor() {
        this.container = null;
        this.activeModal = null;
        this._keydownHandler = this._handleKeydown.bind(this);
    }

    _ensureContainer() {
        if (!this.container) {
            this.container = document.getElementById('modal-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'modal-container';
                document.body.appendChild(this.container);
            }
        }
    }

    open({ title, content, footer = null, size = 'md', onClose = null }) {
        this._ensureContainer();
        this.close();

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('aria-modal', 'true');

        const dialog = document.createElement('div');
        dialog.className = `modal-dialog modal-${size}`;

        dialog.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${this._escape(title)}</h3>
                <button type="button" class="modal-close-btn" aria-label="Fechar janela">${Icons.close}</button>
            </div>
            <div class="modal-body"></div>
            ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        `;

        const bodyEl = dialog.querySelector('.modal-body');
        if (typeof content === 'string') {
            bodyEl.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            bodyEl.appendChild(content);
        }

        const closeBtn = dialog.querySelector('.modal-close-btn');
        closeBtn.addEventListener('click', () => this.close());

        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                this.close();
            }
        });

        backdrop.appendChild(dialog);
        this.container.appendChild(backdrop);
        this.activeModal = { backdrop, onClose };

        document.body.classList.add('modal-open');
        document.addEventListener('keydown', this._keydownHandler);

        // Foco inicial
        setTimeout(() => {
            const focusable = dialog.querySelector('input:not([disabled]), button:not([disabled]), textarea, select');
            if (focusable) focusable.focus();
        }, 50);

        return dialog;
    }

    close() {
        if (this.activeModal) {
            if (typeof this.activeModal.onClose === 'function') {
                this.activeModal.onClose();
            }
            if (this.activeModal.backdrop.parentElement) {
                this.activeModal.backdrop.parentElement.removeChild(this.activeModal.backdrop);
            }
            this.activeModal = null;
        }
        document.body.classList.remove('modal-open');
        document.removeEventListener('keydown', this._keydownHandler);
    }

    confirm({
        title = 'Confirmação',
        message = 'Deseja prosseguir com esta ação?',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        danger = false,
        onConfirm
    }) {
        const footer = `
            <button type="button" class="btn btn-secondary modal-cancel-btn">${this._escape(cancelText)}</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'} modal-confirm-btn">${this._escape(confirmText)}</button>
        `;

        const dialog = this.open({
            title,
            content: `<p class="modal-confirm-text">${this._escape(message)}</p>`,
            footer,
            size: 'sm'
        });

        const cancelBtn = dialog.querySelector('.modal-cancel-btn');
        const confirmBtn = dialog.querySelector('.modal-confirm-btn');

        cancelBtn.addEventListener('click', () => this.close());
        confirmBtn.addEventListener('click', async () => {
            confirmBtn.disabled = true;
            confirmBtn.textContent = 'Processando...';
            try {
                if (onConfirm) await onConfirm();
                this.close();
            } catch (err) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = confirmText;
            }
        });
    }

    _handleKeydown(e) {
        if (e.key === 'Escape' && this.activeModal) {
            this.close();
        }
    }

    _escape(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

export const Modal = new ModalManager();
