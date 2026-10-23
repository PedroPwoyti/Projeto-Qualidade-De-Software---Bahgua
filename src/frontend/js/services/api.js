/**
 * Módulo Centralizado de Integração com a API - Bahgua Telas
 * Trata autenticação JWT, cabeçalhos, erros 401/403 e comunicação com todos os endpoints.
 */

import { CONFIG } from '../config.js';
import { Auth } from './auth.js';

class ApiService {
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        const token = Auth.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        let response;
        try {
            response = await fetch(url, config);
        } catch (networkError) {
            console.error('Falha de rede ou servidor inacessível:', networkError);
            const err = new Error('Não foi possível conectar ao servidor. Verifique se o backend está em execução.');
            err.status = 0;
            throw err;
        }

        // Sessão expirada ou token inválido
        if (response.status === 401) {
            // Se já não estiver na tela de login, limpa a sessão e redireciona
            if (endpoint !== '/auth/login') {
                Auth.clearSession();
                window.location.hash = '#/login';
            }
        }

        let data = null;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                data = await response.json();
            } catch {
                data = null;
            }
        }

        if (!response.ok) {
            const mensagem = (data && data.erro) ? data.erro : `Erro na requisição (código ${response.status}).`;
            const error = new Error(mensagem);
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    // ==========================================
    // Autenticação
    // ==========================================
    async login(email, senha) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha })
        });
    }

    // ==========================================
    // Clientes
    // ==========================================
    async getClientes(filtros = {}) {
        const queryParams = new URLSearchParams();
        if (filtros.nome) queryParams.append('nome', filtros.nome.trim());
        if (filtros.telefone) queryParams.append('telefone', filtros.telefone.trim());
        if (filtros.cpfCnpj) queryParams.append('cpfCnpj', filtros.cpfCnpj.trim());
        if (filtros.incluirInativos) queryParams.append('incluirInativos', 'true');

        const qs = queryParams.toString();
        const endpoint = `/clientes${qs ? `?${qs}` : ''}`;
        return this.request(endpoint, { method: 'GET' });
    }

    async getCliente(id) {
        return this.request(`/clientes/${id}`, { method: 'GET' });
    }

    async createCliente(dados) {
        return this.request('/clientes', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    async updateCliente(id, dados) {
        return this.request(`/clientes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }

    async ativarCliente(id) {
        return this.request(`/clientes/${id}/ativar`, {
            method: 'PATCH'
        });
    }

    async desativarCliente(id) {
        return this.request(`/clientes/${id}/desativar`, {
            method: 'PATCH'
        });
    }

    async getClienteOrdens(id) {
        return this.request(`/clientes/${id}/ordens`, {
            method: 'GET'
        });
    }

    // ==========================================
    // Funcionários
    // ==========================================
    async getFuncionarios(perfil) {
        let endpoint = '/funcionarios';
        if (perfil) {
            endpoint += `?perfil=${encodeURIComponent(perfil)}`;
        }
        return this.request(endpoint, { method: 'GET' });
    }

    async getFuncionario(id) {
        return this.request(`/funcionarios/${id}`, { method: 'GET' });
    }

    async createFuncionario(dados) {
        return this.request('/funcionarios', {
            method: 'POST',
            body: JSON.stringify(dados)
        });
    }

    async updateFuncionario(id, dados) {
        return this.request(`/funcionarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dados)
        });
    }

    async ativarFuncionario(id) {
        return this.request(`/funcionarios/${id}/ativar`, {
            method: 'PATCH'
        });
    }

    async desativarFuncionario(id) {
        return this.request(`/funcionarios/${id}/desativar`, {
            method: 'PATCH'
        });
    }
}

export const Api = new ApiService();
