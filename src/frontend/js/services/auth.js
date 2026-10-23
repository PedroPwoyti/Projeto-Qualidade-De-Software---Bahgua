/**
 * Serviço de Autenticação e Sessão - Bahgua Telas
 * Gerencia o estado de autenticação, perfil do usuário e permissões no frontend.
 */

import { CONFIG } from '../config.js';

class AuthService {
    constructor() {
        this._listeners = [];
    }

    getToken() {
        return sessionStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    setToken(token) {
        if (token) {
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        } else {
            sessionStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        }
    }

    getUser() {
        const raw = sessionStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    setUser(user) {
        if (user) {
            sessionStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
        } else {
            sessionStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        }
    }

    isAuthenticated() {
        return !!this.getToken() && !!this.getUser();
    }

    getRole() {
        const user = this.getUser();
        return user ? user.perfil : null;
    }

    hasRole(...roles) {
        const role = this.getRole();
        return !!role && roles.includes(role);
    }

    isSelf(id) {
        const user = this.getUser();
        return user && Number(user.id) === Number(id);
    }

    canManageClients() {
        return this.hasRole(CONFIG.ROLES.ADMIN, CONFIG.ROLES.ATENDENTE);
    }

    canManageEmployees() {
        return this.hasRole(CONFIG.ROLES.ADMIN);
    }

    saveSession(token, user) {
        this.setToken(token);
        this.setUser(user);
        this._notify();
    }

    clearSession() {
        sessionStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        sessionStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
        this._notify();
    }

    logout() {
        this.clearSession();
        window.location.hash = '#/login';
    }

    onAuthChange(listener) {
        this._listeners.push(listener);
        return () => {
            this._listeners = this._listeners.filter(l => l !== listener);
        };
    }

    _notify() {
        const authData = {
            isAuthenticated: this.isAuthenticated(),
            user: this.getUser()
        };
        this._listeners.forEach(listener => {
            try {
                listener(authData);
            } catch (err) {
                console.error('Erro em ouvinte de auth:', err);
            }
        });
    }
}

export const Auth = new AuthService();
