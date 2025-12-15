# 🎰 The Sellentt Drop - Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

**Backend robusto e escalável para o sistema de gacha** 🚀

</div>

---

## 📖 Sobre

Backend RESTful desenvolvido com Node.js, Express e TypeScript, utilizando Firebase Admin SDK para autenticação e Firestore como banco de dados. Fornece todas as APIs necessárias para o funcionamento do sistema de gacha.

---

## ⚡ Quick Start

### Instalação

```bash
npm install
```

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Project Settings > Service Accounts**
3. Clique em **Generate new private key**
4. Salve o arquivo como `serviceAccountKey.json` na raiz da pasta backend

```bash
# Copie o exemplo e adicione suas credenciais
cp serviceAccountKey.example.json serviceAccountKey.json
```

### Execução

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Build para produção
npm run build

# Executar produção
npm start
```

**Servidor rodando em:** `http://localhost:3000`

---

## 📂 Estrutura do Projeto

```
backend/
├── src/
│   ├── config/
│   │   └── firebase.ts              # Configuração do Firebase Admin
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts       # Registro e login
│   │   ├── box.controller.ts        # CRUD de boxes
│   │   ├── gacha.controller.ts      # Sistema de pull
│   │   ├── item.controller.ts       # CRUD de itens
│   │   ├── user.controller.ts       # Gerenciamento de usuários
│   │   └── achievement.controller.ts # Sistema de conquistas
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts       # Validação de token JWT
│   │   └── requireAdmin.middleware.ts # Verificação de admin
│   │
│   ├── routes/
│   │   ├── auth.routes.ts           # Rotas de autenticação
│   │   ├── box.routes.ts            # Rotas de boxes
│   │   ├── gacha.routes.ts          # Rotas de gacha
│   │   ├── item.routes.ts           # Rotas de itens
│   │   ├── user.routes.ts           # Rotas de usuários
│   │   └── achievement.routes.ts    # Rotas de conquistas
│   │
│   └── server.ts                    # Ponto de entrada da aplicação
│
├── fix-boxes.js                     # Script de migração/correção
├── package.json
├── tsconfig.json
└── serviceAccountKey.json           # Credenciais Firebase (não versionado)
```

---

## 🛣️ Rotas da API

### 🔐 Autenticação (`/api/auth`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/auth/register` | Registrar novo usuário | ❌ |
| POST | `/api/auth/login` | Login de usuário | ❌ |

**Exemplo de Registro:**
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "senha123",
  "displayName": "João Silva"
}
```

**Resposta:**
```json
{
  "message": "Usuário criado com sucesso",
  "userId": "abc123...",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 📦 Boxes (`/api/boxes`)

| Método | Rota | Descrição | Auth | Admin |
|--------|------|-----------|------|-------|
| GET | `/api/boxes` | Listar todas as boxes | ✅ | ❌ |
| GET | `/api/boxes/:id` | Detalhes de uma box | ✅ | ❌ |
| POST | `/api/boxes` | Criar nova box | ✅ | ✅ |
| PUT | `/api/boxes/:id` | Atualizar box | ✅ | ✅ |
| DELETE | `/api/boxes/:id` | Deletar box | ✅ | ✅ |

**Exemplo de Criação:**
```json
POST /api/boxes
{
  "name": "Mystical Treasure",
  "description": "Box cheia de itens místicos",
  "imageUrl": "https://...",
  "cost": 100
}
```

---

### 🎁 Itens (`/api/items`)

| Método | Rota | Descrição | Auth | Admin |
|--------|------|-----------|------|-------|
| GET | `/api/items` | Listar todos os itens | ✅ | ❌ |
| GET | `/api/items/box/:boxId` | Itens de uma box específica | ✅ | ❌ |
| POST | `/api/items` | Criar novo item | ✅ | ✅ |
| PUT | `/api/items/:id` | Atualizar item | ✅ | ✅ |
| DELETE | `/api/items/:id` | Deletar item | ✅ | ✅ |

**Exemplo de Criação:**
```json
POST /api/items
{
  "name": "Espada Lendária",
  "description": "Uma arma poderosa",
  "imageUrl": "https://...",
  "rarity": "lendario",
  "boxId": "box123"
}
```

**Raridades Disponíveis:**
- `comum` (60%)
- `raro` (25%)
- `epico` (10%)
- `lendario` (5%)
- `quantum` (0.1%)

---

### 🎰 Gacha (`/api/gacha`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/api/gacha/pull` | Fazer um pull | ✅ |
| GET | `/api/gacha/:boxId` | Informações da box | ✅ |

**Exemplo de Pull:**
```json
POST /api/gacha/pull
{
  "boxId": "box123"
}
```

**Resposta:**
```json
{
  "success": true,
  "item": {
    "id": "item456",
    "name": "Espada Lendária",
    "rarity": "lendario",
    "imageUrl": "https://..."
  },
  "userCoins": 900
}
```

**Erros Possíveis:**
- `400`: Moedas insuficientes
- `404`: Box não encontrada
- `500`: Erro ao processar pull

---

### 👤 Usuários (`/api/users`)

| Método | Rota | Descrição | Auth | Admin |
|--------|------|-----------|------|-------|
| GET | `/api/users` | Listar todos os usuários | ✅ | ✅ |
| GET | `/api/users/:id` | Dados do usuário | ✅ | ❌ |
| GET | `/api/users/:id/inventory` | Inventário do usuário | ✅ | ❌ |

**Resposta do Inventário:**
```json
{
  "items": [
    {
      "itemId": "item456",
      "name": "Espada Lendária",
      "rarity": "lendario",
      "quantity": 2,
      "acquiredAt": "2025-12-15T10:30:00Z"
    }
  ]
}
```

---

### 🏆 Conquistas (`/api/achievements`)

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| GET | `/api/achievements/:userId` | Listar conquistas do usuário | ✅ |
| POST | `/api/achievements/claim` | Resgatar recompensa | ✅ |

**Conquistas Disponíveis:**

| Nome | Descrição | Recompensa |
|------|-----------|------------|
| **Primeira Coleção** | Ganhe seu primeiro item | 50 moedas |
| **Colecionador Iniciante** | Tenha 10 itens | 100 moedas |
| **Colecionador Experiente** | Tenha 50 itens | 250 moedas |
| **Mestre Colecionador** | Tenha 100 itens | 500 moedas |
| **Sortudo** | Ganhe um item raro | 75 moedas |
| **Muito Sortudo** | Ganhe um item épico | 150 moedas |
| **Extremamente Sortudo** | Ganhe um item lendário | 300 moedas |
| **Existência Quântica** | Ganhe um item quantum | 1000 moedas |
| **Primeiro Pull** | Faça seu primeiro pull | 25 moedas |
| **Pull Entusiasta** | Faça 10 pulls | 100 moedas |
| **Pull Fanático** | Faça 50 pulls | 300 moedas |
| **Mestre do Gacha** | Faça 100 pulls | 750 moedas |
| **Gastador** | Gaste 1000 moedas | 200 moedas |
| **Grande Gastador** | Gaste 5000 moedas | 500 moedas |
| **Mega Gastador** | Gaste 10000 moedas | 1000 moedas |
| **Diversidade** | Tenha pelo menos 1 item de cada raridade | 500 moedas |

**Exemplo de Resgate:**
```json
POST /api/achievements/claim
{
  "achievementId": "primeira-colecao"
}
```

---

## 🔒 Autenticação

Todas as rotas protegidas requerem um token JWT no header:

```http
Authorization: Bearer <token>
```

### Como Funciona:

1. **Login/Registro**: Retorna um token JWT
2. **Requests**: Inclua o token no header `Authorization`
3. **Middleware**: Valida o token e extrai o `userId`
4. **Admin Check**: Algumas rotas verificam se `isAdmin: true`

### Exemplo de Uso:

```javascript
const response = await fetch('http://localhost:3000/api/gacha/pull', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...'
  },
  body: JSON.stringify({ boxId: 'box123' })
});
```

---

## 🗄️ Banco de Dados (Firestore)

### Coleções:

#### **users**
```typescript
{
  id: string;           // UID do Firebase Auth
  email: string;
  displayName: string;
  coins: number;        // Moedas do usuário
  isAdmin: boolean;     // Permissão de admin
  createdAt: Timestamp;
  totalPulls: number;   // Total de pulls feitos
  totalSpent: number;   // Total de moedas gastas
}
```

#### **boxes**
```typescript
{
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;         // Custo em moedas
  createdAt: Timestamp;
}
```

#### **items**
```typescript
{
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: 'comum' | 'raro' | 'epico' | 'lendario' | 'quantum';
  boxId: string;        // Referência à box
  createdAt: Timestamp;
}
```

#### **userItems**
```typescript
{
  id: string;
  userId: string;
  itemId: string;
  quantity: number;
  acquiredAt: Timestamp;
}
```

#### **achievements**
```typescript
{
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt?: Timestamp;
  rewardClaimed: boolean;
}
```

---

## ⚙️ Configuração

### Variáveis de Ambiente (Futuro)

Crie um arquivo `.env` na raiz do backend:

```env
PORT=3000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
```

### Scripts Disponíveis

```json
{
  "dev": "nodemon src/server.ts",      // Desenvolvimento
  "build": "tsc",                       // Build
  "start": "node dist/server.js",       // Produção
  "fix-boxes": "node fix-boxes.js"      // Script de correção
}
```

---

## 🛠️ Tecnologias

- **Node.js** 18.13+
- **Express** 4.19+ - Framework web
- **TypeScript** 5.4+ - Type safety
- **Firebase Admin SDK** 12.6+ - Auth & Database
- **Firestore** - NoSQL database
- **ts-node** - Execução TypeScript
- **nodemon** - Hot reload

---

## 🔧 Scripts Utilitários

### `fix-boxes.js`

Script para corrigir boxes sem itemCount:

```bash
node fix-boxes.js
```

---

## 📈 Melhorias Futuras

- [ ] Rate limiting
- [ ] Validação com Zod/Joi
- [ ] Logs estruturados (Winston)
- [ ] Testes unitários (Jest)
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Documentação Swagger/OpenAPI
- [ ] WebSockets para notificações em tempo real

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Faça commits descritivos
4. Abra um Pull Request

---

## 📝 Licença

MIT License - veja LICENSE para detalhes.

---

<div align="center">

**Feito com ❤️ e TypeScript**

</div>
