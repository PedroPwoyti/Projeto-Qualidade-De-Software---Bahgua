/**
 * Tela de Gestão de Clientes - Bahgua Telas
 * Listagem, busca avançada por múltiplos critérios, criação, edição, ativação/desativação e histórico de ordens.
 */

import { Api } from '../services/api.js';
import { Auth } from '../services/auth.js';
import { Icons } from '../components/icons.js';
import { Toast } from '../components/toast.js';
import { Modal } from '../components/modal.js';

export class ClientesView {
    static async render() {
        const canManage = Auth.canManageClients();

        return `
            <div class="view-clientes">
                <!-- Barra Superior de Controle -->
                <div class="page-action-bar">
                    <div class="action-bar-left">
                        <h2 class="view-heading">Gerenciamento de Clientes</h2>
                        <p class="view-subheading">Cadastre e acompanhe os clientes atendidos pela assistência técnica.</p>
                    </div>
                    <div class="action-bar-right">
                        ${canManage ? `
                            <button type="button" class="btn btn-primary" id="btn-novo-cliente">
                                <span class="btn-icon">${Icons.plus}</span>
                                <span>Novo Cliente</span>
                            </button>
                        ` : `
                            <span class="badge badge-info" title="Perfil Técnico possui permissão apenas de visualização">
                                Modo Leitura (Técnico)
                            </span>
                        `}
                    </div>
                </div>

                <!-- Painel de Filtros e Pesquisa -->
                <div class="filter-card">
                    <form id="form-filtros-clientes" class="filter-form">
                        <div class="filter-grid">
                            <div class="form-group">
                                <label for="filtro-nome" class="form-label-sm">Nome do cliente</label>
                                <div class="input-with-icon">
                                    <span class="input-icon">${Icons.search}</span>
                                    <input type="text" id="filtro-nome" class="form-control form-control-sm" placeholder="Buscar por nome...">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="filtro-telefone" class="form-label-sm">Telefone</label>
                                <div class="input-with-icon">
                                    <span class="input-icon">${Icons.phone}</span>
                                    <input type="text" id="filtro-telefone" class="form-control form-control-sm" placeholder="ex: (42) 99999 ou 42999">
                                </div>
                            </div>

                            <div class="form-group">
                                <label for="filtro-cpf-cnpj" class="form-label-sm">CPF ou CNPJ</label>
                                <div class="input-with-icon">
                                    <span class="input-icon">${Icons.shield}</span>
                                    <input type="text" id="filtro-cpf-cnpj" class="form-control form-control-sm" placeholder="Somente dígitos ou pontuado">
                                </div>
                            </div>

                            <div class="form-group filter-checkbox-group">
                                <label class="checkbox-label" for="filtro-inativos">
                                    <input type="checkbox" id="filtro-inativos">
                                    <span>Incluir clientes inativos</span>
                                </label>
                            </div>
                        </div>

                        <div class="filter-actions-row">
                            <button type="submit" class="btn btn-sm btn-primary">
                                <span class="btn-icon">${Icons.search}</span>
                                Filtrar
                            </button>
                            <button type="button" class="btn btn-sm btn-secondary" id="btn-limpar-filtros">
                                Limpar Filtros
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Tabela de Dados -->
                <div class="table-card">
                    <div id="clientes-table-container">
                        <div class="loading-state-box">
                            <div class="spinner"></div>
                            <span>Consultando clientes na API...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    static attachEvents() {
        const formFiltros = document.getElementById('form-filtros-clientes');
        const btnLimpar = document.getElementById('btn-limpar-filtros');
        const btnNovo = document.getElementById('btn-novo-cliente');
        const filtroInativos = document.getElementById('filtro-inativos');
        filtroInativos?.addEventListener('change', () => this.loadClientes());

        if (formFiltros) {
            formFiltros.addEventListener('submit', (e) => {
                e.preventDefault();
                this.loadClientes();
            });
        }

        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => {
                document.getElementById('filtro-nome').value = '';
                document.getElementById('filtro-telefone').value = '';
                document.getElementById('filtro-cpf-cnpj').value = '';
                document.getElementById('filtro-inativos').checked = false;
                this.loadClientes();
            });
        }

        if (btnNovo) {
            btnNovo.addEventListener('click', () => {
                this.openClienteModal(null);
            });
        }

        this.loadClientes();
    }

    static async loadClientes() {
        const requestId = this._loadRequestId = (this._loadRequestId || 0) + 1;
        const container = document.getElementById('clientes-table-container');
        if (!container) return;

        container.innerHTML = `
            <div class="loading-state-box">
                <div class="spinner"></div>
                <span>Consultando clientes na API...</span>
            </div>
        `;

        const nome = document.getElementById('filtro-nome')?.value.trim();
        const telefone = document.getElementById('filtro-telefone')?.value.trim();
        const cpfCnpj = document.getElementById('filtro-cpf-cnpj')?.value.trim();
        const incluirInativos = document.getElementById('filtro-inativos')?.checked;

        try {
            const clientes = await Api.getClientes({
                nome,
                telefone,
                cpfCnpj,
                incluirInativos
            });

            if (requestId === this._loadRequestId && container.isConnected) this.renderTable(clientes);
        } catch (err) {
            if (requestId !== this._loadRequestId || !container.isConnected) return;
            console.error('Erro ao listar clientes:', err);
            container.innerHTML = `
                <div class="alert alert-danger" style="margin: 1.5rem;">
                    <span class="alert-icon">${Icons.alertTriangle}</span>
                    <span>Falha ao carregar clientes: ${this._escape(err.message)}</span>
                </div>
            `;
        }
    }

    static renderTable(clientes) {
        const container = document.getElementById('clientes-table-container');
        if (!container) return;

        if (!clientes || clientes.length === 0) {
            container.innerHTML = `
                <div class="empty-state-box">
                    <div class="empty-icon">${Icons.clientes}</div>
                    <h4>Nenhum cliente encontrado</h4>
                    <p>Não há clientes correspondentes aos critérios de pesquisa informados.</p>
                </div>
            `;
            return;
        }

        const canManage = Auth.canManageClients();

        container.innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 60px;">ID</th>
                            <th>Nome do Cliente</th>
                            <th>CPF / CNPJ</th>
                            <th>Contato</th>
                            <th>Endereço</th>
                            <th style="width: 100px;">Status</th>
                            <th style="width: 160px; text-align: right;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${clientes.map(c => `
                            <tr class="${c.ativo ? '' : 'row-inativo'}">
                                <td><span class="id-tag">#${c.id}</span></td>
                                <td>
                                    <div class="client-name-cell">
                                        <strong>${this._escape(c.nome)}</strong>
                                        <span class="client-email-sub">${this._escape(c.email)}</span>
                                    </div>
                                </td>
                                <td><code>${this._formatarCpfCnpj(c.cpfCnpj)}</code></td>
                                <td>
                                    <div class="phone-list-cell">
                                        ${(c.telefones || []).map(t => `
                                            <span class="phone-item">${Icons.phone} ${this._escape(t)}</span>
                                        `).join('')}
                                    </div>
                                </td>
                                <td><span class="address-text" title="${this._escape(c.endereco)}">${this._escape(c.endereco)}</span></td>
                                <td>
                                    <span class="badge ${c.ativo ? 'badge-ativo' : 'badge-inativo'}">
                                        ${c.ativo ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td>
                                    <div class="table-actions-group">
                                        <button type="button" class="btn-action-icon btn-action-view" data-id="${c.id}" title="Visualizar detalhes e ordens">
                                            ${Icons.view}
                                        </button>
                                        ${canManage ? `
                                            <button type="button" class="btn-action-icon btn-action-edit" data-id="${c.id}" title="Editar cliente">
                                                ${Icons.edit}
                                            </button>
                                            ${c.ativo ? `
                                                <button type="button" class="btn-action-icon btn-action-deactivate" data-id="${c.id}" data-nome="${this._escape(c.nome)}" title="Desativar cliente">
                                                    ${Icons.ban}
                                                </button>
                                            ` : `
                                                <button type="button" class="btn-action-icon btn-action-activate" data-id="${c.id}" data-nome="${this._escape(c.nome)}" title="Ativar cliente">
                                                    ${Icons.check}
                                                </button>
                                            `}
                                        ` : ''}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="table-footer-info">
                <span>Total de registros listados: <strong>${clientes.length}</strong></span>
            </div>
        `;

        // Eventos dos botões da tabela
        container.querySelectorAll('.btn-action-view').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.openVisualizarModal(id);
            });
        });

        if (canManage) {
            container.querySelectorAll('.btn-action-edit').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    try {
                        const cliente = await Api.getCliente(id);
                        this.openClienteModal(cliente);
                    } catch (err) {
                        Toast.error(err.message || 'Falha ao buscar dados do cliente.');
                    }
                });
            });

            container.querySelectorAll('.btn-action-deactivate').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const nome = btn.getAttribute('data-nome');
                    Modal.confirm({
                        title: 'Desativar Cliente',
                        message: `Tem certeza de que deseja desativar o cliente "${nome}"? Ele não aparecerá na listagem padrão.`,
                        confirmText: 'Desativar',
                        danger: true,
                        onConfirm: async () => {
                            try {
                                await Api.desativarCliente(id);
                                Toast.success('Cliente desativado com sucesso.');
                                await this.loadClientes();
                            } catch (err) {
                                Toast.error(err.message || 'Erro ao desativar cliente.');
                                throw err;
                            }
                        }
                    });
                });
            });

            container.querySelectorAll('.btn-action-activate').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = btn.getAttribute('data-id');
                    const nome = btn.getAttribute('data-nome');
                    Modal.confirm({
                        title: 'Ativar Cliente',
                        message: `Deseja reativar o cliente "${nome}"?`,
                        confirmText: 'Ativar Cliente',
                        danger: false,
                        onConfirm: async () => {
                            try {
                                await Api.ativarCliente(id);
                                Toast.success('Cliente ativado com sucesso.');
                                await this.loadClientes();
                            } catch (err) {
                                Toast.error(err.message || 'Erro ao ativar cliente.');
                                throw err;
                            }
                        }
                    });
                });
            });
        }
    }

    static openClienteModal(cliente = null) {
        const isEdit = !!cliente;
        const title = isEdit ? `Editar Cliente #${cliente.id}` : 'Cadastrar Novo Cliente';

        const telefonesIniciais = (cliente && cliente.telefones && cliente.telefones.length > 0)
            ? cliente.telefones
            : [''];

        const modalContent = document.createElement('div');
        modalContent.innerHTML = `
            <form id="form-cliente-modal" class="modal-form" novalidate>
                <div class="alert alert-danger" id="modal-error-alert" style="display: none;">
                    <span class="alert-icon">${Icons.alertTriangle}</span>
                    <span class="alert-message" id="modal-error-message"></span>
                </div>

                <div class="form-group">
                    <label for="cliente-nome" class="form-label">Nome completo <span class="required">*</span></label>
                    <input type="text" id="cliente-nome" class="form-control" value="${isEdit ? this._escape(cliente.nome) : ''}" placeholder="Ex: João da Silva" required>
                </div>

                <div class="form-row">
                    <div class="form-group col-md-6">
                        <label for="cliente-email" class="form-label">E-mail <span class="required">*</span></label>
                        <input type="email" id="cliente-email" class="form-control" value="${isEdit ? this._escape(cliente.email) : ''}" placeholder="exemplo@email.com" required>
                    </div>

                    <div class="form-group col-md-6">
                        <label for="cliente-cpf-cnpj" class="form-label">CPF ou CNPJ <span class="required">*</span></label>
                        <input type="text" id="cliente-cpf-cnpj" class="form-control" value="${isEdit ? this._escape(cliente.cpfCnpj) : ''}" placeholder="000.000.000-00 ou CNPJ" required>
                    </div>
                </div>

                <div class="form-group">
                    <label for="cliente-endereco" class="form-label">Endereço completo <span class="required">*</span></label>
                    <input type="text" id="cliente-endereco" class="form-control" value="${isEdit ? this._escape(cliente.endereco) : ''}" placeholder="Rua, número, bairro, cidade - UF" required>
                </div>

                <div class="form-group">
                    <div class="phones-header-row">
                        <label class="form-label">Telefones para contato <span class="required">*</span></label>
                        <button type="button" class="btn btn-sm btn-outline" id="btn-add-phone">
                            ${Icons.plus} Adicionar Telefone
                        </button>
                    </div>
                    <div id="phones-container" class="phones-inputs-list">
                        ${telefonesIniciais.map((tel, idx) => `
                            <div class="phone-input-row">
                                <input type="text" class="form-control cliente-telefone-input" value="${this._escape(tel)}" placeholder="(42) 99999-0000" required>
                                ${idx > 0 ? `
                                    <button type="button" class="btn-remove-phone" title="Remover telefone">${Icons.close}</button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </form>
        `;

        const footer = `
            <button type="button" class="btn btn-secondary" id="modal-btn-cancelar">Cancelar</button>
            <button type="button" class="btn btn-primary" id="modal-btn-salvar">
                <span class="btn-text">${isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
                <span class="btn-spinner" style="display: none;"></span>
            </button>
        `;

        const dialog = Modal.open({
            title,
            content: modalContent,
            footer,
            size: 'md'
        });

        // Adição dinâmica de telefones
        const phonesContainer = dialog.querySelector('#phones-container');
        const btnAddPhone = dialog.querySelector('#btn-add-phone');
        if (btnAddPhone && phonesContainer) {
            btnAddPhone.addEventListener('click', () => {
                const row = document.createElement('div');
                row.className = 'phone-input-row';
                row.innerHTML = `
                    <input type="text" class="form-control cliente-telefone-input" placeholder="(42) 99999-0000" required>
                    <button type="button" class="btn-remove-phone" title="Remover telefone">${Icons.close}</button>
                `;
                row.querySelector('.btn-remove-phone').addEventListener('click', () => {
                    phonesContainer.removeChild(row);
                });
                phonesContainer.appendChild(row);
                row.querySelector('input').focus();
            });
        }

        // Delegação de remoção de telefones existentes
        dialog.querySelectorAll('.btn-remove-phone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('.phone-input-row');
                if (row && phonesContainer.children.length > 1) {
                    phonesContainer.removeChild(row);
                }
            });
        });

        // Ações de salvar
        const btnCancelar = dialog.querySelector('#modal-btn-cancelar');
        const btnSalvar = dialog.querySelector('#modal-btn-salvar');
        const errorAlert = dialog.querySelector('#modal-error-alert');
        const errorMessage = dialog.querySelector('#modal-error-message');

        btnCancelar.addEventListener('click', () => Modal.close());

        btnSalvar.addEventListener('click', async () => {
            errorAlert.style.display = 'none';

            const nome = dialog.querySelector('#cliente-nome').value.trim();
            const email = dialog.querySelector('#cliente-email').value.trim();
            const cpfCnpj = dialog.querySelector('#cliente-cpf-cnpj').value.trim();
            const endereco = dialog.querySelector('#cliente-endereco').value.trim();

            const telefoneInputs = dialog.querySelectorAll('.cliente-telefone-input');
            const telefones = Array.from(telefoneInputs)
                .map(input => input.value.trim())
                .filter(val => val.length > 0);

            // Validações básicas no cliente para experiência rica
            if (!nome || !email || !cpfCnpj || !endereco) {
                errorMessage.textContent = 'Por favor, preencha todos os campos obrigatórios (*).';
                errorAlert.style.display = 'flex';
                return;
            }

            if (telefones.length === 0) {
                errorMessage.textContent = 'Informe ao menos um telefone de contato.';
                errorAlert.style.display = 'flex';
                return;
            }

            const dados = {
                nome,
                email,
                cpfCnpj,
                endereco,
                telefones
            };

            const btnText = btnSalvar.querySelector('.btn-text');
            const btnSpinner = btnSalvar.querySelector('.btn-spinner');
            btnSalvar.disabled = true;
            if (btnText) btnText.textContent = 'Enviando...';
            if (btnSpinner) btnSpinner.style.display = 'inline-block';

            try {
                if (isEdit) {
                    await Api.updateCliente(cliente.id, dados);
                    Toast.success('Cliente atualizado com sucesso!');
                } else {
                    await Api.createCliente(dados);
                    Toast.success('Cliente cadastrado com sucesso!');
                }
                Modal.close();
                this.loadClientes();
            } catch (err) {
                console.error('Erro ao salvar cliente:', err);
                errorMessage.textContent = err.message || 'Falha ao processar solicitação no servidor.';
                errorAlert.style.display = 'flex';
                btnSalvar.disabled = false;
                if (btnText) btnText.textContent = isEdit ? 'Salvar Alterações' : 'Cadastrar Cliente';
                if (btnSpinner) btnSpinner.style.display = 'none';
            }
        });
    }

    static async openVisualizarModal(id) {
        const dialog = Modal.open({
            title: `Detalhes do Cliente #${id}`,
            content: `
                <div class="loading-state-box">
                    <div class="spinner"></div>
                    <span>Carregando dados do cliente e ordens de serviço...</span>
                </div>
            `,
            footer: '<button type="button" class="btn btn-secondary" onclick="document.querySelector(\'.modal-close-btn\').click()">Fechar</button>',
            size: 'md'
        });

        try {
            const cliente = await Api.getCliente(id);
            let ordens = [];
            try {
                ordens = await Api.getClienteOrdens(id);
            } catch {
                ordens = [];
            }

            const bodyEl = dialog.querySelector('.modal-body');
            bodyEl.innerHTML = `
                <div class="view-client-details">
                    <div class="client-header-profile">
                        <div class="client-avatar-large">
                            ${cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div class="client-header-info">
                            <h3 class="client-title">${this._escape(cliente.nome)}</h3>
                            <div class="client-status-badge">
                                <span class="badge ${cliente.ativo ? 'badge-ativo' : 'badge-inativo'}">
                                    ${cliente.ativo ? 'Cadastro Ativo' : 'Cadastro Inativo'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="details-grid">
                        <div class="detail-item">
                            <span class="detail-label">CPF / CNPJ:</span>
                            <span class="detail-value"><code>${this._formatarCpfCnpj(cliente.cpfCnpj)}</code></span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">E-mail:</span>
                            <span class="detail-value">${this._escape(cliente.email)}</span>
                        </div>
                        <div class="detail-item detail-full">
                            <span class="detail-label">Endereço:</span>
                            <span class="detail-value">${this._escape(cliente.endereco)}</span>
                        </div>
                        <div class="detail-item detail-full">
                            <span class="detail-label">Telefones:</span>
                            <span class="detail-value">
                                ${(cliente.telefones || []).map(t => `
                                    <span class="phone-item">${Icons.phone} ${this._escape(t)}</span>
                                `).join('')}
                            </span>
                        </div>
                    </div>

                    <hr class="section-divider">

                    <div class="client-ordens-section">
                        <div class="section-header-row">
                            <h4 class="section-subtitle">
                                <span class="subtitle-icon">${Icons.ordens}</span>
                                Ordens de Serviço Vinculadas
                            </h4>
                            <span class="badge badge-planejado">Integração API (GET /clientes/${id}/ordens)</span>
                        </div>

                        ${ordens && ordens.length > 0 ? `
                            <div class="table-responsive">
                                <table class="data-table table-condensed">
                                    <thead>
                                        <tr>
                                            <th>Nº Ordem</th>
                                            <th>Aparelho</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${ordens.map(o => `
                                            <tr>
                                                <td>#${o.id}</td>
                                                <td>${this._escape(o.aparelho || '-')}</td>
                                                <td>${this._escape(o.status || '-')}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="empty-state-card">
                                <div class="empty-icon-sm">${Icons.ordens}</div>
                                <p>Nenhuma ordem de serviço vinculada a este cliente no momento.</p>
                                <small>O módulo de Ordens de Serviço está em fase de planejamento no backend.</small>
                            </div>
                        `}
                    </div>
                </div>
            `;
        } catch (err) {
            const bodyEl = dialog.querySelector('.modal-body');
            bodyEl.innerHTML = `
                <div class="alert alert-danger">
                    ${Icons.alertTriangle} Falha ao carregar detalhes do cliente: ${this._escape(err.message)}
                </div>
            `;
        }
    }

    static _formatarCpfCnpj(valor) {
        if (!valor) return '-';
        const digits = valor.replace(/\D/g, '');
        if (digits.length === 11) {
            return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (digits.length === 14) {
            return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
        }
        return valor;
    }

    static _escape(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
