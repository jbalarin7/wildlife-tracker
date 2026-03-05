# Wildlife Tracker

Plataforma colaborativa de rastreamento de fauna e flora com autenticação, mapa interativo, upload de imagens e API RESTful.

---

## Requisitos

| Ferramenta | Versão mínima |
|---|---|
| Python | 3.11+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Estrutura do projeto

```
wildlife-tracker/
├── backend/
│   ├── app/
│   │   ├── main.py        # API FastAPI
│   │   ├── database.py    # schema SQLite e migrações
│   │   └── security.py    # hashing, JWT, tokens de e-mail
│   ├── tests/
│   │   └── test_api.py    # testes de integração
│   ├── uploads/           # imagens enviadas (criado automaticamente)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── public/
│   │   └── paw.svg        # favicon
│   ├── package.json
│   └── vite.config.js
└── docs/
    └── implementation-plan.md
```

---

## Backend

### 1. Criar o ambiente virtual e instalar dependências

```bash
cd backend
python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1

# Windows (Git Bash)
source .venv/Scripts/activate

pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente (opcional mas recomendado)

```bash
# Linux / macOS / Git Bash
export WILDLIFE_SECRET_KEY="troque-por-uma-string-longa-e-aleatoria"

# Windows PowerShell
$env:WILDLIFE_SECRET_KEY = "troque-por-uma-string-longa-e-aleatoria"
```

> Sem essa variável a API sobe com uma chave insegura e exibe um aviso no terminal.
> **Nunca use o valor padrão em produção.**

### 3. Iniciar o servidor de desenvolvimento

```bash
cd backend
uvicorn app.main:app --reload
```

O servidor fica disponível em `http://localhost:8000`.
Documentação interativa (Swagger): `http://localhost:8000/docs`

### 4. Rodar os testes

```bash
cd backend
pytest -v
```

---

## Frontend

### 1. Instalar dependências

```bash
cd frontend
npm install
```

### 2. Iniciar o servidor de desenvolvimento

> O backend precisa estar rodando em `localhost:8000` antes de subir o frontend.

```bash
cd frontend
npm run dev
```

A aplicação abre em `http://localhost:5173`.

O Vite faz proxy automático de `/api/*` → `http://localhost:8000`, então não é necessário configurar CORS manualmente durante o desenvolvimento.

### 3. Build de produção

```bash
cd frontend
npm run build
# Saída em frontend/dist/
```

---

## Rodando backend + frontend juntos (dois terminais)

**Terminal 1 — Backend:**
```bash
cd backend
source .venv/bin/activate   # ou .venv\Scripts\activate no Windows
uvicorn app.main:app --reload
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Acesse `http://localhost:5173` no navegador.

---

## Fluxo básico de uso da API

### Registro e login

```bash
# 1. Registrar
curl -X POST http://localhost:8000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@exemplo.com","password":"senhafort3"}'
# Resposta inclui "verification_link"

# 2. Verificar e-mail (usar o token retornado acima)
curl "http://localhost:8000/auth/verify-email?token=TOKEN_AQUI"

# 3. Fazer login
curl -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@exemplo.com","password":"senhafort3"}'
# Resposta inclui "access_token"
```

### Registrar uma ocorrência

```bash
curl -X POST http://localhost:8000/occurrences \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "category=fauna" \
  -F "common_name=Onça-pintada" \
  -F "scientific_name=Panthera onca" \
  -F "observed_at=2026-03-01T08:00:00+00:00" \
  -F "latitude=-15.7939" \
  -F "longitude=-47.8828" \
  -F "description=Vista próximo ao córrego"
```

### Listar ocorrências com paginação e busca

```bash
curl "http://localhost:8000/occurrences?limit=10&offset=0&category=fauna&q=onca"
```

### Deletar uma ocorrência (somente o autor)

```bash
curl -X DELETE http://localhost:8000/occurrences/1 \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Trocar senha

```bash
curl -X POST http://localhost:8000/auth/change-password \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"current_password":"senhafort3","new_password":"novasenha99"}'
```

### Esqueci a senha

```bash
# 1. Solicitar reset
curl -X POST http://localhost:8000/auth/forgot-password \
  -H 'Content-Type: application/json' \
  -d '{"email":"usuario@exemplo.com"}'
# Resposta inclui "reset_link" (em produção seria enviado por e-mail)

# 2. Redefinir senha
curl -X POST http://localhost:8000/auth/reset-password \
  -H 'Content-Type: application/json' \
  -d '{"token":"TOKEN_DO_LINK","new_password":"novasenha99"}'
```

### Mapa GeoJSON com bounding box

```bash
curl "http://localhost:8000/map/geojson?min_lat=-16&max_lat=-15&min_lng=-48&max_lng=-47"
```

---

## Endpoints disponíveis

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Cadastro (limite: 5/min) |
| GET | `/auth/verify-email?token=` | — | Verifica e-mail |
| POST | `/auth/login` | — | Login, retorna JWT (limite: 10/min) |
| POST | `/auth/forgot-password` | — | Solicita reset de senha (limite: 3/min) |
| POST | `/auth/reset-password` | — | Redefine senha via token |
| GET | `/auth/me` | Sim | Dados do usuário logado |
| POST | `/auth/change-password` | Sim | Troca senha (requer senha atual) |
| POST | `/occurrences` | Sim | Cria ocorrência (suporta upload de imagens) |
| GET | `/occurrences` | — | Lista paginada com filtros |
| GET | `/occurrences/{id}` | — | Detalhe de uma ocorrência |
| DELETE | `/occurrences/{id}` | Sim | Remove ocorrência (somente autor) |
| GET | `/map/geojson` | — | GeoJSON para mapa (filtro por bbox) |
| GET | `/uploads/{arquivo}` | — | Imagens enviadas |

---

## Segurança

- Senhas: PBKDF2-HMAC-SHA256, 200.000 iterações.
- Tokens de acesso: JWT (HS256) com expiração de 7 dias.
- Rate limiting nos endpoints de autenticação.
- Tokens de verificação e reset: `secrets.token_urlsafe(32)` com expiração.
- **A variável `WILDLIFE_SECRET_KEY` deve ser definida em produção.**

---

## Plano de evolução

Veja [`docs/implementation-plan.md`](docs/implementation-plan.md) para o roadmap completo.
