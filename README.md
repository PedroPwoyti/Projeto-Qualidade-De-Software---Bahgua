# Projeto Qualidade de Software - Bahgua

API REST desenvolvida em Node.js com Express para o sistema Bahgua. O projeto segue uma arquitetura em camadas estruturada em Entidades (Entity), Repositórios (Repository), Serviços (Service) e Controladores (Controller), com persistência temporária de dados em memória.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada para suporte ao `--watch`)
- [npm](https://www.npmjs.com/)

---

## Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/PedroPwoyti/Projeto-Qualidade-De-Software---Bahgua.git
   cd Projeto-Qualidade-De-Software---Bahgua
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Copie o arquivo `.env.example` para `.env` e ajuste as variáveis conforme necessário:
   ```bash
   # No Linux/macOS:
   cp .env.example .env

   # No Windows (PowerShell):
   Copy-Item .env.example .env

   # No Windows (CMD):
   copy .env.example .env
   ```

4. **Inicie o servidor:**
   - **Modo de produção:**
     ```bash
     npm start
     ```
   - **Modo de desenvolvimento (com recarregamento automático):**
     ```bash
     npm run dev
     ```

Por padrão, a aplicação e o frontend estarão acessíveis em: `http://localhost:3000`

Ao executar `npm start` ou `npm run dev`, o sistema cria o Super Admin configurado no ambiente, dois funcionários e três clientes fictícios para demonstração:

| Funcionário | Perfil | E-mail | Senha inicial |
| :--- | :--- | :--- | :--- |
| Mariana Santos | Atendente | `atendente@bahgua.com` | `atendente123` |
| Lucas Oliveira | Técnico | `tecnico@bahgua.com` | `tecnico123` |

Os clientes iniciais são Ana Souza, Bruno Lima e Carla Ferreira. Os dados ficam em memória e são recriados ao reiniciar o servidor. A inicialização não duplica registros já existentes nem redefine suas alterações na mesma execução.

---

## Frontend do Sistema

A aplicação inclui uma interface web completa (SPA modular com JavaScript ES6 nativo e CSS3 moderno), servida diretamente pelo Express:
- **Acesso:** Abra `http://localhost:3000` no seu navegador.
- **Identidade Visual:** Paleta de assistência técnica profissional com contraste em azul-marinho (`#304356`), azul principal (`#2878C8`), azul-claro (`#DCEAF5`), branco (`#FFFFFF`) e cinza-escuro (`#28323D`).
- **Autenticação Real:** Login integrado ao endpoint `POST /auth/login`, envio automático de token JWT no cabeçalho `Authorization: Bearer <token>`, tratamento de expiração (401) e permissões (403).
- **Credenciais Iniciais para Acesso:**
  - **E-mail:** `admin@bahgua.com`
  - **Senha:** `admin123`
- **Dashboard (Visão Geral):** Contadores calculados em tempo real consultando a API (`GET /clientes`, `GET /funcionarios`), atalhos operacionais e lista de clientes recentes.
- **Gestão de Clientes:** Tabela com busca por múltiplos critérios (nome, telefone com comparação de dígitos, CPF/CNPJ), cadastro e edição com máscaras dinâmicas, ativação/desativação e histórico de ordens (`GET /clientes/:id/ordens`).
- **Gestão de Funcionários:** Exclusiva para o perfil Administrador, com filtragem por cargo, edição e salvaguardas para impedir auto-desativação.
- **Módulos Planejados:** Telas conceituais para Produtos, Ordens de Serviço, Histórico e Configurações, detalhando a arquitetura sem gerar registros fictícios.
- **Design Responsivo:** Totalmente adaptado para desktops, tablets e celulares (com menu lateral recolhível em gaveta off-canvas).

---

## Variáveis de Ambiente

As configurações da aplicação são gerenciadas via variáveis de ambiente definidas no arquivo `.env`:

| Variável | Descrição | Valor Padrão (.env.example) |
| :--- | :--- | :--- |
| `PORT` | Porta onde o servidor Express irá escutar | `3000` |
| `JWT_SECRET` | Chave secreta para assinatura de tokens JWT *(obrigatória para iniciar o servidor)* | `exemplo_segredo_jwt_longo_e_seguro_minimo_32_caracteres_dev` |
| `ADMIN_NOME` | Nome do administrador padrão do sistema | `Administrador` |
| `ADMIN_EMAIL` | E-mail do administrador padrão | `admin@bahgua.com` |
| `ADMIN_SENHA` | Senha do administrador padrão | `admin123` |

---

## Autenticação e Controle de Acesso

A API utiliza autenticação baseada em **JWT (JSON Web Token)**.

### Como obter o token
Faça uma requisição `POST /auth/login` enviando o e-mail e a senha do funcionário. Se as credenciais forem válidas e o funcionário estiver ativo, a resposta retornará um token JWT válido por 8 horas.

### Como usar o token
Em todas as rotas protegidas, inclua o token no cabeçalho HTTP `Authorization` no seguinte formato:
```http
Authorization: Bearer <seu_token_jwt>
```
Caso o cabeçalho esteja ausente, com formato incorreto, inválido ou expirado, a API responderá com status `401 Unauthorized`.

### Revalidação Contínua de Acesso e Segurança
O acesso e os privilégios são revalidados no repositório a cada requisição através do middleware de autenticação:
- **Bloqueio imediato:** Se um funcionário for desativado (`PATCH /funcionarios/:id/desativar`), seu token é bloqueado imediatamente para qualquer requisição subsequente, retornando `403 Forbidden`. Caso seja reativado (`PATCH /funcionarios/:id/ativar`), o mesmo token volta a ser aceito.
- **Atualização instantânea de perfil:** As permissões associadas à requisição (`req.usuario`) utilizam o perfil atualizado do funcionário no banco/repositório, e não as informações estáticas presentes no token. Assim, alterar o perfil de um funcionário (ex: de atendente para técnico) altera suas permissões imediatamente sem necessidade de novo login.
- **Tokens órfãos:** Caso um token válido pertença a um funcionário que não existe mais no repositório (como após reinicialização do sistema com dados em memória), a requisição é rejeitada com `401 Unauthorized`.
- **Proteção do Administrador:** Um administrador autenticado é impedido de desativar a si mesmo ou de alterar seu próprio perfil para um perfil diferente de administrador (retornando `400 Bad Request`).

### Tabela de Permissões por Perfil

| Endpoint / Operação | Administrador | Atendente | Técnico |
| :--- | :---: | :---: | :---: |
| `POST /auth/login` | Público | Público | Público |
| `GET /clientes` | Permitido | Permitido | Permitido |
| `GET /clientes/:id` | Permitido | Permitido | Permitido |
| `POST /clientes` | Permitido | Permitido | Negado (403) |
| `PUT /clientes/:id` | Permitido | Permitido | Negado (403) |
| `DELETE /clientes/:id` | Permitido | Permitido | Negado (403) |
| `GET /funcionarios` | Permitido | Negado (403) | Negado (403) |
| `GET /funcionarios/:id` | Permitido | Negado (403) | Negado (403) |
| `POST /funcionarios` | Permitido | Negado (403) | Negado (403) |
| `PUT /funcionarios/:id` | Permitido | Negado (403) | Negado (403) |
| `PATCH /funcionarios/:id/ativar` | Permitido | Negado (403) | Negado (403) |
| `PATCH /funcionarios/:id/desativar` | Permitido *(exceto a si próprio)* | Negado (403) | Negado (403) |

---

## Endpoints

### Autenticação

Rotas públicas para acesso ao sistema.

#### 1. Login
- **Método:** `POST`
- **Rota:** `/auth/login`
- **Autenticação:** Pública (não requer token)
- **Corpo da Requisição (JSON):**
  ```json
  {
    "email": "admin@bahgua.com",
    "senha": "admin123"
  }
  ```
- **Resposta de Sucesso:** `200 OK`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "funcionario": {
      "id": 1,
      "nome": "Administrador",
      "email": "admin@bahgua.com",
      "perfil": "administrador",
      "ativo": true
    }
  }
  ```
- **Respostas de Erro:**
  - `401 Unauthorized` (e-mail ou senha incorretos):
    ```json
    {
      "erro": "Credenciais inválidas."
    }
    ```
  - `403 Forbidden` (caso o funcionário esteja inativo):
    ```json
    {
      "erro": "Funcionário inativo. Acesso negado."
    }
    ```

---

### Clientes

Gerenciamento de clientes cadastrados no sistema. *(Requer cabeçalho `Authorization: Bearer <token>`)*

#### 1. Listar Clientes
- **Método:** `GET`
- **Rota:** `/clientes`
- **Resposta de Sucesso:** `200 OK`
  ```json
  [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "endereco": "Rua das Flores, 123",
      "telefones": ["(11) 98765-4321"]
    }
  ]
  ```

#### 2. Buscar Cliente por ID
- **Método:** `GET`
- **Rota:** `/clientes/:id`
- **Parâmetros de URL:** `id` (número identificador do cliente)
- **Resposta de Sucesso:** `200 OK`
  ```json
  {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "endereco": "Rua das Flores, 123",
    "telefones": ["(11) 98765-4321"]
  }
  ```
- **Resposta de Erro:** `404 Not Found`
  ```json
  {
    "erro": "Cliente não encontrado."
  }
  ```

#### 3. Cadastrar Cliente
- **Método:** `POST`
- **Rota:** `/clientes`
- **Corpo da Requisição (JSON):**
  ```json
  {
    "nome": "João Silva",
    "email": "joao@email.com",
    "endereco": "Rua das Flores, 123",
    "telefones": ["(11) 98765-4321"]
  }
  ```
  - **Campos obrigatórios:**
    - `nome` (string, não vazio)
    - `email` (string, não vazio)
    - `endereco` (string, não vazio)
    - `telefones` (array de strings, não vazio)
- **Resposta de Sucesso:** `201 Created`
  ```json
  {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@email.com",
    "endereco": "Rua das Flores, 123",
    "telefones": ["(11) 98765-4321"]
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request`
    ```json
    {
      "erro": "O campo 'nome' é obrigatório e deve ser texto."
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "erro": "Erro ao criar cliente."
    }
    ```

#### 4. Atualizar Cliente
- **Método:** `PUT`
- **Rota:** `/clientes/:id`
- **Parâmetros de URL:** `id` (número identificador do cliente)
- **Corpo da Requisição (JSON):**
  ```json
  {
    "nome": "João Silva Atualizado",
    "email": "joao.novo@email.com",
    "endereco": "Avenida Central, 456",
    "telefones": ["(11) 98765-4321", "(11) 91234-5678"]
  }
  ```
- **Resposta de Sucesso:** `200 OK`
  ```json
  {
    "id": 1,
    "nome": "João Silva Atualizado",
    "email": "joao.novo@email.com",
    "endereco": "Avenida Central, 456",
    "telefones": ["(11) 98765-4321", "(11) 91234-5678"]
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request` (validação de campos)
  - `404 Not Found`
    ```json
    {
      "erro": "Cliente não encontrado."
    }
    ```
  - `500 Internal Server Error`
    ```json
    {
      "erro": "Erro ao atualizar cliente."
    }
    ```

#### 5. Excluir Cliente
- **Método:** `DELETE`
- **Rota:** `/clientes/:id`
- **Parâmetros de URL:** `id` (número identificador do cliente)
- **Resposta de Sucesso:** `204 No Content`
- **Resposta de Erro:** `404 Not Found`
  ```json
  {
    "erro": "Cliente não encontrado."
  }
  ```

---

### Funcionários

Gerenciamento de funcionários do sistema (atendentes, técnicos e administradores).

#### 1. Listar Funcionários
- **Método:** `GET`
- **Rota:** `/funcionarios`
- **Query Params (opcional):**
  - `perfil`: filtra por perfil (`atendente`, `tecnico` ou `administrador`). Caso um perfil inválido seja informado, retorna `400 Bad Request`.
- **Resposta de Sucesso:** `200 OK`
  ```json
  [
    {
      "id": 1,
      "nome": "Maria Santos",
      "email": "maria@bahgua.com",
      "perfil": "atendente",
      "ativo": true
    }
  ]
  ```
- **Resposta de Erro:** `400 Bad Request` (se perfil for inválido)
  ```json
  {
    "erro": "Perfil inválido para filtro. Valores permitidos: atendente, tecnico, administrador."
  }
  ```

#### 2. Buscar Funcionário por ID
- **Método:** `GET`
- **Rota:** `/funcionarios/:id`
- **Parâmetros de URL:** `id` (número identificador do funcionário)
- **Resposta de Sucesso:** `200 OK`
  ```json
  {
    "id": 1,
    "nome": "Maria Santos",
    "email": "maria@bahgua.com",
    "perfil": "atendente",
    "ativo": true
  }
  ```
- **Resposta de Erro:** `404 Not Found`
  ```json
  {
    "erro": "Funcionário não encontrado."
  }
  ```

#### 3. Cadastrar Funcionário
- **Método:** `POST`
- **Rota:** `/funcionarios`
- **Corpo da Requisição (JSON):**
  ```json
  {
    "nome": "Maria Santos",
    "email": "maria@bahgua.com",
    "senha": "senhaSegura123",
    "perfil": "atendente"
  }
  ```
  - **Campos obrigatórios:**
    - `nome` (string, não vazio)
    - `email` (string, formato válido)
    - `senha` (string, mínimo 8 caracteres)
    - `perfil` (`atendente`, `tecnico` ou `administrador`)
- **Resposta de Sucesso:** `201 Created` *(sem exibir campos de senha ou hash)*
  ```json
  {
    "id": 1,
    "nome": "Maria Santos",
    "email": "maria@bahgua.com",
    "perfil": "atendente",
    "ativo": true
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request` (validação de campos obrigatórios, tamanho de senha ou perfil inválido)
  - `409 Conflict` (se o e-mail já estiver cadastrado)
    ```json
    {
      "erro": "Já existe um funcionário cadastrado com este e-mail."
    }
    ```

#### 4. Atualizar Funcionário
- **Método:** `PUT`
- **Rota:** `/funcionarios/:id`
- **Parâmetros de URL:** `id` (número identificador do funcionário)
- **Corpo da Requisição (JSON):**
  ```json
  {
    "nome": "Maria Santos Atualizada",
    "email": "maria.novo@bahgua.com",
    "perfil": "tecnico",
    "senha": "novaSenhaOpcional123"
  }
  ```
  - **Campos:**
    - `nome` (string, obrigatório)
    - `email` (string, obrigatório e formato válido)
    - `perfil` (obrigatório: `atendente`, `tecnico` ou `administrador`)
    - `senha` (opcional: se enviada, deve conter no mínimo 8 caracteres; se omitida, a senha atual é mantida)
- **Resposta de Sucesso:** `200 OK`
  ```json
  {
    "id": 1,
    "nome": "Maria Santos Atualizada",
    "email": "maria.novo@bahgua.com",
    "perfil": "tecnico",
    "ativo": true
  }
  ```
- **Respostas de Erro:**
  - `400 Bad Request` (validação de campos)
  - `404 Not Found` (`{ "erro": "Funcionário não encontrado." }`)
  - `409 Conflict` (`{ "erro": "Já existe outro funcionário cadastrado com este e-mail." }`)

#### 5. Ativar Funcionário
- **Método:** `PATCH`
- **Rota:** `/funcionarios/:id/ativar`
- **Parâmetros de URL:** `id` (número identificador do funcionário)
- **Resposta de Sucesso:** `200 OK`
  ```json
  {
    "id": 1,
    "nome": "Maria Santos",
    "email": "maria@bahgua.com",
    "perfil": "atendente",
    "ativo": true
  }
  ```
- **Resposta de Erro:** `404 Not Found`
  ```json
  {
    "erro": "Funcionário não encontrado."
  }
  ```

#### 6. Desativar Funcionário
- **Método:** `PATCH`
- **Rota:** `/funcionarios/:id/desativar`
- **Parâmetros de URL:** `id` (número identificador do funcionário)
- **Resposta de Sucesso:** `200 OK`
  ```json
  {
    "id": 1,
    "nome": "Maria Santos",
    "email": "maria@bahgua.com",
    "perfil": "atendente",
    "ativo": false
  }
  ```
- **Resposta de Erro:** `404 Not Found`
  ```json
  {
    "erro": "Funcionário não encontrado."
  }
  ```


---

## Testes Automatizados

A suíte de testes automatizados utiliza o executor nativo do Node.js (`node:test` e `node:assert`) e `fetch` nativo, cobrindo autenticação, controle de acesso, funcionários e clientes.

Para executar todos os testes da aplicação:
```bash
npm test
```
