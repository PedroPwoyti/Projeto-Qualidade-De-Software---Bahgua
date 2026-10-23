/**
 * Configurações da aplicação Frontend - Bahgua Telas
 */

export const CONFIG = {
    // A URL base da API utiliza caminho relativo vazio quando servido pelo mesmo Express,
    // ou lê de window.__ENV__ se configurado para ambiente desacoplado.
    API_BASE_URL: (window.__ENV__ && window.__ENV__.API_URL) ? window.__ENV__.API_URL : '',
    
    // Nomes dos perfis do sistema
    ROLES: {
        ADMIN: 'administrador',
        ATENDENTE: 'atendente',
        TECNICO: 'tecnico'
    },

    // Rótulos legíveis dos perfis
    ROLE_LABELS: {
        administrador: 'Administrador',
        atendente: 'Atendente',
        tecnico: 'Técnico'
    },

    // Chaves de armazenamento
    STORAGE_KEYS: {
        TOKEN: 'bahgua_auth_token',
        USER: 'bahgua_auth_user'
    }
};
