/**
 * Tela de Login - Bahgua Telas
 * Composição dividida (painel azul-marinho com identidade visual e formulário moderno).
 */

import { Api } from '../services/api.js';
import { Auth } from '../services/auth.js';
import { Toast } from '../components/toast.js';
import { Icons } from '../components/icons.js';

export class LoginView {
    static render() {
        return `
            <div class="login-wrapper">
                <div class="login-container">
                    <!-- Painel Visual da Esquerda (Inspirado na referência de assistência técnica) -->
                    <div class="login-hero-panel">
                        <div class="hero-brand">
                            <div class="hero-brand-icon">
                                ${Icons.logo}
                            </div>
                            <span class="hero-brand-name">Bahgua Telas</span>
                        </div>

                        <div class="hero-content">
                            <div class="hero-badge">
                                <span class="badge-icon">${Icons.tools}</span>
                                <span>Gestão Especializada</span>
                            </div>

                            <h2 class="hero-title">Manutenção & assistência técnica</h2>
                            <p class="hero-description">
                                Plataforma interna para controle de ordens de serviço, gerenciamento de clientes,
                                peças e equipe técnica de laboratório.
                            </p>

                            <!-- Mini cards de recursos visuais inspirados na referência -->
                            <div class="hero-features-grid">
                                <div class="hero-feature-item">
                                    <div class="feature-icon-box">${Icons.mobile}</div>
                                    <div class="feature-text">
                                        <strong>Smartphones</strong>
                                        <span>Telas, baterias e placas</span>
                                    </div>
                                </div>
                                <div class="hero-feature-item">
                                    <div class="feature-icon-box">${Icons.laptop}</div>
                                    <div class="feature-text">
                                        <strong>Computadores</strong>
                                        <span>Hardware, reparos e SO</span>
                                    </div>
                                </div>
                                <div class="hero-feature-item">
                                    <div class="feature-icon-box">${Icons.tools}</div>
                                    <div class="feature-text">
                                        <strong>Assistência Rápida</strong>
                                        <span>Rastreabilidade total</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="hero-footer">
                            <span>Sistema Bahgua Telas &copy; 2026 — Qualidade de Software</span>
                        </div>
                    </div>

                    <!-- Painel de Acesso / Formulário da Direita -->
                    <div class="login-form-panel">
                        <div class="form-container-inner">
                            <div class="form-header">
                                <h1 class="form-title">Acesse o sistema</h1>
                                <p class="form-subtitle">Informe seu e-mail e senha cadastrados para entrar</p>
                            </div>

                            <div class="alert alert-danger" id="login-error-alert" style="display: none;" role="alert">
                                <span class="alert-icon">${Icons.alertTriangle}</span>
                                <span class="alert-message" id="login-error-message"></span>
                            </div>

                            <form id="login-form" class="login-form" novalidate>
                                <div class="form-group">
                                    <label for="login-email" class="form-label">E-mail de acesso</label>
                                    <div class="input-with-icon">
                                        <span class="input-icon">${Icons.mail}</span>
                                        <input 
                                            type="email" 
                                            id="login-email" 
                                            class="form-control" 
                                            placeholder="ex: admin@bahgua.com" 
                                            autocomplete="username" 
                                            required
                                        >
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="login-senha" class="form-label">Senha</label>
                                    <div class="input-with-icon">
                                        <span class="input-icon">${Icons.shield}</span>
                                        <input 
                                            type="password" 
                                            id="login-senha" 
                                            class="form-control" 
                                            placeholder="Digite sua senha" 
                                            autocomplete="current-password" 
                                            required
                                        >
                                        <button type="button" class="btn-toggle-password" id="btn-toggle-password" aria-label="Mostrar ou ocultar senha">
                                            <span id="pwd-icon-show">${Icons.view}</span>
                                            <span id="pwd-icon-hide" style="display: none;">${Icons.eyeOff}</span>
                                        </button>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-primary btn-block btn-login" id="btn-submit-login">
                                    <span class="btn-text">Entrar no Sistema</span>
                                    <span class="btn-spinner" style="display: none;"></span>
                                </button>
                            </form>

                            <div class="dev-credentials-hint">
                                <div class="hint-header">
                                    <span class="hint-icon">${Icons.info}</span>
                                    <strong>Acesso inicial para desenvolvimento:</strong>
                                </div>
                                <div class="hint-body">
                                    E-mail: <code>admin@bahgua.com</code> &bull; Senha: <code>admin123</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static attachEvents() {
        const form = document.getElementById('login-form');
        const emailInput = document.getElementById('login-email');
        const senhaInput = document.getElementById('login-senha');
        const submitBtn = document.getElementById('btn-submit-login');
        const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
        const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
        const errorAlert = document.getElementById('login-error-alert');
        const errorMessage = document.getElementById('login-error-message');
        const togglePwdBtn = document.getElementById('btn-toggle-password');
        const pwdIconShow = document.getElementById('pwd-icon-show');
        const pwdIconHide = document.getElementById('pwd-icon-hide');

        if (togglePwdBtn && senhaInput) {
            togglePwdBtn.addEventListener('click', () => {
                const isPassword = senhaInput.type === 'password';
                senhaInput.type = isPassword ? 'text' : 'password';
                if (pwdIconShow && pwdIconHide) {
                    pwdIconShow.style.display = isPassword ? 'none' : 'inline-flex';
                    pwdIconHide.style.display = isPassword ? 'inline-flex' : 'none';
                }
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = emailInput.value.trim();
                const senha = senhaInput.value;

                // Esconde erros anteriores
                if (errorAlert) errorAlert.style.display = 'none';

                if (!email || !senha) {
                    if (errorAlert && errorMessage) {
                        errorMessage.textContent = 'Por favor, preencha o e-mail e a senha.';
                        errorAlert.style.display = 'flex';
                    }
                    return;
                }

                // Estado de carregamento
                if (submitBtn) submitBtn.disabled = true;
                if (btnText) btnText.textContent = 'Autenticando...';
                if (btnSpinner) btnSpinner.style.display = 'inline-block';

                try {
                    const response = await Api.login(email, senha);
                    Auth.saveSession(response.token, response.funcionario);
                    Toast.success(`Bem-vindo, ${response.funcionario.nome}!`);
                    window.location.hash = '#/dashboard';
                } catch (err) {
                    console.error('Falha de autenticação:', err);
                    if (errorAlert && errorMessage) {
                        errorMessage.textContent = err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.';
                        errorAlert.style.display = 'flex';
                    }
                    if (submitBtn) submitBtn.disabled = false;
                    if (btnText) btnText.textContent = 'Entrar no Sistema';
                    if (btnSpinner) btnSpinner.style.display = 'none';
                }
            });
        }

        // Foco inicial no campo de e-mail
        if (emailInput) {
            emailInput.focus();
        }
    }
}
