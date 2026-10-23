/**
 * Tela de Gestão de Funcionários - Bahgua Telas
 * Exclusiva para o perfil Administrador: listagem, cadastro, edição, filtros por perfil e ativação/desativação.
 */

import { Api } from '../services/api.js';
import { Auth } from '../services/auth.js';
import { Icons } from '../components/icons.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';
import { CONFIG } from '../config.js';

export class FuncionariosView {
    static async render() {
        const isAdmin = Auth.hasRole('administrador');

        if (!isAdmin) {
            return `
                <div class="view-restricted-access">
                    <div class="restricted-card">
                        <div class="restricted-icon-box">${Icons.shield}</div>
                        <h2 class="restricted-title">Acesso Restrito ao Administrador</h2>
                        <p class="restricted-description">
                            Apenas usuários com perfil <strong>Administrador</strong> possuem autorização para visualizar,
                            cadastrar e gerenciar a equipe de funcionários da assistência técnica.
                        </p>
                        <div class="restricted-actions">
                            <a href="#/dashboard" class="btn btn-primary">Voltar à Visão Geral</a>
                            <a href="#/clientes" class="btn btn-secondary">Acessar Clientes</a>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="view-funcionarios">
                <!-- Barra Superior de Controle -->
                <div class="page-action-bar">
                    <div class="action-bar-left">
                        <h2 class="view-heading">Equipe de Funcionários</h2>
                        <p class="view-subheading">Gerencie os acessos, cargos e credenciais da equipe da Bahgua Telas.</p>
                    </div>
                    <div class="action-bar-right">
                        <button type="button" class="btn btn-primary" id="btn-novo-funcionario">
                            <span class="btn-icon">${Icons.plus}</span>
                            <span>Novo Funcionário</span>
                        </button>
                    </div>
                </div>

                <!-- Filtro por Perfil -->
                <div class="filter-card">
                    <div class="filter-row-simple">
                        <div class="form-group-inline">
                            <label for="filtro-perfil-funcionario" class="form-label-sm">Filtrar por Perfil:</label>
                            <select id="filtro-perfil-funcionario" class="form-control form-control-sm select-auto-width">
                                <option value="">Todos os perfis</option>
                                <option value="administrador">Administrador</option>
                                <option value="atendente">Atendente</option>
                                <option value="tecnico">Técnico</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Tabela de Dados -->
                <div class="table-card">
                    <div id="funcionarios-table-container">
                        <div class="loading-state-box">
                            <div class="spinner"></div>
                            <span>Consultando funcionários na API...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static attachEvents() {
        const isAdmin = Auth.hasRole('administrador');
        if (!isAdmin) return;

        const selectPerfil = document.getElementById('filtro-perfil-funcionario');
        const btnNovo = document.getElementById('btn-novo-funcionario');

        if (selectPerfil) {
            selectPerfil.addEventListener('change', () => {
                this.loadFuncionarios();
            });
        }

        if (btnNovo) {
            btnNovo.addEventListener('click', () => {
                this.openFuncionarioModal(null);
            });
        }

        this.loadFuncionarios();
    }

    static async loadFuncionarios() {
        const container = document.getElementById('funcionarios-table-container');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-state-box">
                <div class="spinner"></div>
                <span>Consultando funcionários na API...</span>
            </div>
        `;

        const perfil = document.getElementById('filtro-perfil-funcionario')?.value || '';

        try {
            const funcionarios = await Api.getFuncionarios(perfil);
            this.renderTable(funcionarios);
        } catch (err) {
            console.error('Erro ao listar funcionários:', err);
            container.innerHTML = `
                <div class="alert alert-danger" style="margin: 1.5rem;">
                    <span class="alert-icon">${Icons.alertTriangle}</span>
                    <span>Falha ao carregar equipe: ${this._escape(err.message)}</span>
                </div>
            `;
        }
    }

    static renderTable(funcionarios) {
        const container = document.getElementById('funcionarios-table-container');
        if (!container) return;

        if (!funcionarios || funcionarios.length === 0) {
            container.innerHTML = `
                <div class="empty-state-box">
                    <div class="empty-icon">${Icons.funcionarios}</div>
                    <h4>Nenhum funcionário encontrado</h4>
                    <p>Não há colaboradores cadastrados para o filtro selecionado.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th>Nome do Funcionário</th>
                            <th>E-mail</th>
                            <th>Perfil / Função</th>
                            <th style="width: 100px;">Status</th>
                            <th style="width: 160px; text-align: right;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${funcionarios.map(f => {
                            const isSelf = Auth.isSelf(f.id);
                            return `
                                <tr class="${f.ativo ? '' : 'row-inativo'}">
                                    <td><span class="id-tag">#${f.id}</span></td>
                                    <td>
                                        <div class="client-name-cell">
                                            <strong>${this._escape(f.nome)}</strong>
                                            ${isSelf ? '<span class="self-user-tag">(Sua Conta)</span>' : ''}
                                        </div>
                                    </td>
                                    <td><code>${this._escape(f.email)}</code></td>
                                    <td>
                                        <span class="user-role-tag role-${f.perfil}">
                                            ${f.superAdmin ? 'Super Admin' : (CONFIG.ROLE_LABELS[f.perfil] || f.perfil)}
                                        </span>
                                    </td>
                                    <td>
                                        <span class="badge ${f.ativo ? 'badge-ativo' : 'badge-inativo'}">
                                            ${f.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="table-actions-group">
                                            <button type="button" class="btn-action-icon btn-action-edit-func" data-id="${f.id}" ${f.superAdmin && !isSelf ? 'disabled title="Somente o titular pode editar o Super Admin"' : 'title="Editar funcionário"'}>
                                                ${Icons.edit}
                                            </button>
                                            ${f.ativo ? `
                                                <button type="button" class="btn-action-icon btn-action-deactivate-func" data-id="${f.id}" data-nome="${this._escape(f.nome)}" ${f.superAdmin ? 'disabled title="A conta Super Admin não pode ser desativada"' : isSelf ? 'disabled title="Você não pode desativar a própria conta de administrador"' : 'title="Desativar funcionário"'}>
                                                    ${Icons.ban}
                                                </button>
                                            ` : `
                                                <button type="button" class="btn-action-icon btn-action-activate-func" data-id="${f.id}" data-nome="${this._escape(f.nome)}" title="Ativar funcionário">
                                                    ${Icons.check}
                                                </button>
                                            `}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            <div class="table-footer-info">
                <span>Total de colaboradores: <strong>${funcionarios.length}</strong></span>
            </div>
        `;

        // Eventos
        container.querySelectorAll('.btn-action-edit-func:not([disabled])').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                try {
                    const func = await Api.getFuncionario(id);
                    this.openFuncionarioModal(func);
                } catch (err) {
                    Toast.error(err.message || 'Falha ao buscar funcionário.');
                }
            });
        });

        container.querySelectorAll('.btn-action-deactivate-func:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const nome = btn.getAttribute('data-nome');
                Modal.confirm({
                    title: 'Desativar Funcionário',
                    message: `Tem certeza de que deseja desativar o funcionário "${nome}"? O acesso ao sistema será revogado imediatamente.`,
                    confirmText: 'Desativar',
                    danger: true,
                    onConfirm: async () => {
                        try {
                            await Api.desativarFuncionario(id);
                            Toast.success('Funcionário desativado com sucesso.');
                            this.loadFuncionarios();
                        } catch (err) {
                            Toast.error(err.message || 'Erro ao desativar funcionário.');
                        }
                    }
                });
            });
        });

        container.querySelectorAll('.btn-action-activate-func').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const nome = btn.getAttribute('data-nome');
                Modal.confirm({
                    title: 'Ativar Funcionário',
                    message: `Deseja reativar o acesso de "${nome}" ao sistema?`,
                    confirmText: 'Ativar Acesso',
                    danger: false,
                    onConfirm: async () => {
                        try {
                            await Api.ativarFuncionario(id);
                            Toast.success('Funcionário ativado com sucesso.');
                            this.loadFuncionarios();
                        } catch (err) {
                            Toast.error(err.message || 'Erro ao ativar funcionário.');
                        }
                    }
                });
            });
        });
    }

    static openFuncionarioModal(funcionario = null) {
        const isEdit = !!funcionario;
        const isSelf = isEdit && Auth.isSelf(funcionario.id);
        const title = isEdit ? `Editar Funcionário #${funcionario.id}` : 'Cadastrar Novo Funcionário';

        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <form id="form-func-modal" class="modal-form" novalidate>
                <div class="alert alert-danger" id="modal-func-error-alert" style="display: none;">
                    <span class="alert-icon">${Icons.alertTriangle}</span>
                    <span class="alert-message" id="modal-func-error-message"></span>
                </div>

                <div class="form-group">
                    <label for="func-nome" class="form-label">Nome completo <span class="required">*</span></label>
                    <input type="text" id="func-nome" class="form-control" value="${isEdit ? this._escape(funcionario.nome) : ''}" placeholder="Ex: Maria Santos" required>
                </div>

                <div class="form-group">
                    <label for="func-email" class="form-label">E-mail corporativo <span class="required">*</span></label>
                    <input type="email" id="func-email" class="form-control" value="${isEdit ? this._escape(funcionario.email) : ''}" placeholder="maria@bahgua.com" required>
                </div>

                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="func-perfil" class="form-label">Perfil de Acesso <span class="required">*</span></label>
                        <select id="func-perfil" class="form-control" ${isSelf ? 'disabled title="Você não pode alterar o próprio perfil de administrador"' : ''}>
                            <option value="atendente" ${isEdit && funcionario.perfil === 'atendente' ? 'selected' : ''}>Atendente</option>
                            <option value="tecnico" ${isEdit && funcionario.perfil === 'tecnico' ? 'selected' : ''}>Técnico</option>
                            ${Auth.getUser()?.superAdmin || (isEdit && funcionario.perfil === 'administrador') ? `<option value="administrador" ${isEdit && funcionario.perfil === 'administrador' ? 'selected' : ''}>${funcionario?.superAdmin ? 'Super Admin' : 'Administrador'}</option>` : ''}
                        </select>
                        ${isSelf ? '<small class="form-hint">O perfil do administrador ativo não pode ser alterado por segurança.</small>' : ''}
                    </div>

                    <div class="form-group col-md-6">
                        <label for="func-senha" class="form-label">Senha de acesso ${isEdit ? '' : '<span class="required">*</span>'}</label>
                        <input type="password" id="func-senha" class="form-control" placeholder="${isEdit ? 'Deixe em branco para manter' : 'Mínimo de 6 caracteres'}" ${isEdit ? '' : 'required'}>
                        <small class="form-hint">${isEdit ? 'Preencha apenas se desejar redefinir a senha' : 'Mínimo de 6 caracteres com hash seguro'}</small>
                    </div>
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn btn-secondary" id="modal-func-btn-cancelar">Cancelar</button>
            <button type="button" class="btn btn-primary" id="modal-func-btn-salvar">
                <span class="btn-text">${isEdit ? 'Salvar Alterações' : 'Cadastrar Funcionário'}</span>
                <span class="btn-spinner" style="display: none;"></span>
            </button>
        `;

        const dialog = Modal.open({
            title,
            content: modalContent,
            footer,
            size: 'md'
        });

        const btnCancelar = dialog.querySelector('#modal-func-btn-cancelar');
        const btnSalvar = dialog.querySelector('#modal-func-btn-salvar');
        const errorAlert = dialog.querySelector('#modal-func-error-alert');
        const errorMessage = dialog.querySelector('#modal-func-error-message');

        btnCancelar.addEventListener('click', () => Modal.close());

        btnSalvar.addEventListener('click', async () => {
            errorAlert.style.display = 'none';

            const nome = dialog.querySelector('#func-nome').value.trim();
            const email = dialog.querySelector('#func-email').value.trim();
            const perfil = dialog.querySelector('#func-perfil').value;
            const senha = dialog.querySelector('#func-senha').value;

            if (!nome || !email) {
                errorMessage.textContent = 'Preencha o nome e o e-mail.';
                errorAlert.style.display = 'flex';
                return;
            }

            if (!isEdit && (!senha || senha.length < 6)) {
                errorMessage.textContent = 'A senha inicial deve conter pelo menos 6 caracteres.';
                errorAlert.style.display = 'flex';
                return;
            }

            if (isEdit && senha && senha.length < 6) {
                errorMessage.textContent = 'A nova senha deve conter pelo menos 6 caracteres.';
                errorAlert.style.display = 'flex';
                return;
            }

            const dados = {
                nome,
                email,
                perfil
            };

            if (senha) {
                dados.senha = senha;
            }

            const btnText = btnSalvar.querySelector('.btn-text');
            const btnSpinner = btnSalvar.querySelector('.btn-spinner');
            btnSalvar.disabled = true;
            if (btnText) btnText.textContent = 'Enviando...';
            if (btnSpinner) btnSpinner.style.display = 'inline-block';

            try {
                if (isEdit) {
                    await Api.updateFuncionario(funcionario.id, dados);
                    Toast.success('Funcionário atualizado com sucesso!');
                } else {
                    await Api.createFuncionario(dados);
                    Toast.success('Funcionário cadastrado com sucesso!');
                }
                Modal.close();
                this.loadFuncionarios();
            } catch (err) {
                console.error('Erro ao salvar funcionário:', err);
                errorMessage.textContent = err.message || 'Falha ao processar solicitação no servidor.';
                errorAlert.style.display = 'flex';
                btnSalvar.disabled = false;
                if (btnText) btnText.textContent = isEdit ? 'Salvar Alterações' : 'Cadastrar Funcionário';
                if (btnSpinner) btnSpinner.style.display = 'none';
            }
        });
    }

    static _escape(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
