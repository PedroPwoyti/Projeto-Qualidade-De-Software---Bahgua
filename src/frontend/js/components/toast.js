/**
 * Componente de Notificações Toast - Bahgua Telas
 * Exibe mensagens acessíveis e não intrusivas de sucesso, aviso e erro.
 */

import { Icons } from './icons.js';

class ToastManager {
    constructor() {
        this.container = null;
    }

    _ensureContainer() {
        if (!this.container) {
            this.container = document.getElementById('toast-container');
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'toast-container';
                this.container.className = 'toast-container';
                this.container.setAttribute('aria-live', 'polite');
                document.body.appendChild(this.container);
            }
        }
    }

    show(message, type = 'info', duration = 4000) {
        this._ensureContainer();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');

        let iconSvg = Icons.info;
        if (type === 'success') iconSvg = Icons.check;
        if (type === 'error') iconSvg = Icons.alertTriangle;
        if (type === 'warning') iconSvg = Icons.alertTriangle;

        toast.innerHTML = `
            <div class="toast-icon">${iconSvg}</div>
            <div class="toast-message">${this._escape(message)}</div>
            <button type="button" class="toast-close" aria-label="Fechar notificação">${Icons.close}</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        let timer = null;

        const dismiss = () => {
            if (timer) clearTimeout(timer);
            toast.classList.add('toast-hiding');
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.parentElement.removeChild(toast);
                }
            }, 300);
        };

        closeBtn.addEventListener('click', dismiss);

        if (duration > 0) {
            timer = setTimeout(dismiss, duration);
        }

        this.container.appendChild(toast);
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration = 6000) {
        this.show(message, 'error', duration);
    }

    warning(message, duration = 5000) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }

    _escape(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

export const Toast = new ToastManager();
