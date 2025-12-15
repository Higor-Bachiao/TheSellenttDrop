# 🎰 The Sellentt Drop

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

**Um sistema de gacha moderno e viciante com animações espetaculares! 🎁✨**

[Features](#-features) • [Demo](#-demo) • [Instalação](#-instalação) • [Uso](#-uso) • [Tecnologias](#-tecnologias) • [Estrutura](#-estrutura)

</div>

---

## 📖 Sobre o Projeto

**The Sellentt Drop** é um sistema completo de gacha (loot box) desenvolvido com Angular 18 e Node.js. O projeto oferece uma experiência imersiva de coleta de itens com diferentes raridades, sistema de conquistas, inventário gerenciável e um painel administrativo completo.

### 🎯 O que é um Sistema Gacha?

Gacha é um sistema de recompensas aleatórias popularizado por jogos japoneses, onde os jogadores gastam moeda virtual para "puxar" itens de diferentes raridades. O nome vem das máquinas de cápsulas japonesas (gachapon).

---

## ✨ Features

### 🎮 Para Jogadores

- **🎰 Sistema de Gacha Animado**: Slot machine com animações suaves e timing perfeito
- **🎨 5 Raridades de Itens**: 
  - 🟤 **Common** (Comum)
  - 🔵 **Rare** (Raro) 
  - 🟣 **Epic** (Épico)
  - 🟡 **Legendary** (Lendário)
  - 🌈 **Accidental Quantum Existence** (Ultra Raro)
- **📦 Inventário Inteligente**: 
  - Filtros por raridade, data de aquisição e quantidade
  - Cards visuais com badges de raridade
  - Sistema de cache para carregamento instantâneo
- **🏆 Sistema de Conquistas**: 
  - 16 conquistas diferentes
  - Progresso em tempo real
  - Recompensas em moedas
  - Badges visuais para conquistas completas
- **💰 Sistema de Moedas**: Ganhe e gaste moedas nas boxes

### 👑 Para Administradores

- **🛠️ Painel Admin Completo**:
  - Criar, editar e deletar boxes
  - Gerenciar itens e suas raridades
  - Definir custos e probabilidades
  - Upload de imagens para boxes e itens
- **🔒 Controle de Acesso**: Sistema de autenticação com roles (user/admin)

---

## 🎬 Demo

### Tela de Gacha
```
┌─────────────────────────────────────────┐
│  ✨ MYSTICAL TREASURE BOX ✨            │
│  ╰─────────────────────────╯             │
│  🎁 150 itens • 💰 100 moedas            │
│                                          │
│  ┌────────────────────────────┐         │
│  │     🎰 SLOT MACHINE         │         │
│  │         [Item]              │         │
│  │         [Item]              │         │
│  │      ➤ [Item] ⬅            │         │
│  │         [Item]              │         │
│  │         [Item]              │         │
│  └────────────────────────────┘         │
│                                          │
│     [🎲 PULL - 100 moedas]              │
└─────────────────────────────────────────┘
```

### Sistema de Raridades

| Raridade | Cor | Efeito |
|----------|-----|--------|
| Common | Azul | Borda simples |
| Rare | Laranja | Brilho suave |
| Epic | Roxo | Animação pulsante |
| Legendary | Dourado | Brilho intenso rotativo |
| Quantum | Arco-íris | Gradiente animado multicolorido |

---

## 🚀 Instalação

### Pré-requisitos

- **Node.js** 18.13 ou superior
- **npm** 9.0 ou superior
- **Angular CLI** 17.3.17 ou superior
- **Conta Firebase** (para autenticação e banco de dados)

### 1️⃣ Clone o Repositório

```bash
git clone https://github.com/Higor-Bachiao/TheSellenttDrop.git
cd TheSellenttDrop
```

### 2️⃣ Configuração do Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar Firebase
# 1. Crie um projeto no Firebase Console
# 2. Baixe o arquivo serviceAccountKey.json
# 3. Coloque na raiz da pasta backend
cp serviceAccountKey.example.json serviceAccountKey.json
# Edite o arquivo com suas credenciais

# Iniciar servidor (porta 3000)
npm run dev
```

### 3️⃣ Configuração do Frontend

```bash
cd ..

# Instalar dependências
npm install

# Configurar ambiente
# Edite os arquivos de ambiente com suas configurações do Firebase
# src/environments/environment.ts (desenvolvimento)
# src/environments/environment.prod.ts (produção)

# Iniciar aplicação (porta 4200)
npm start
```

### 4️⃣ Acesse a Aplicação

Abra seu navegador em: **http://localhost:4200**

---

## 🎮 Uso

### Para Jogadores

1. **Registre-se**: Crie uma conta na tela de registro
2. **Explore as Boxes**: Veja todas as boxes disponíveis
3. **Faça Pulls**: Gaste moedas para ganhar itens
4. **Gerencie seu Inventário**: Veja todos os itens que coletou
5. **Complete Conquistas**: Ganhe recompensas extras

### Para Administradores

1. **Faça Login** com conta admin
2. **Acesse Admin Panel** no menu lateral
3. **Crie Boxes**: Adicione novas boxes com imagem e descrição
4. **Adicione Itens**: Configure itens com raridades e imagens
5. **Gerencie o Sistema**: Edite ou delete conforme necessário

---

## 🛠️ Tecnologias

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Angular** | 18.13 | Framework principal |
| **TypeScript** | 5.4+ | Linguagem de programação |
| **RxJS** | 7.8+ | Programação reativa |
| **Bootstrap Icons** | - | Ícones |
| **CSS3** | - | Animações e estilização |

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 18.13+ | Runtime JavaScript |
| **Express** | 4.19+ | Framework web |
| **TypeScript** | 5.4+ | Linguagem de programação |
| **Firebase Admin SDK** | 12.6+ | Autenticação e Firestore |
| **Firestore** | - | Banco de dados NoSQL |

---

## 📂 Estrutura do Projeto

```
TheSellenttDrop-frontend/
├── backend/                    # Backend Node.js + Express
│   ├── src/
│   │   ├── config/            # Configurações (Firebase)
│   │   ├── controllers/       # Lógica de negócio
│   │   ├── middleware/        # Middlewares (auth, admin)
│   │   ├── routes/            # Rotas da API
│   │   └── server.ts          # Servidor principal
│   └── package.json
│
├── src/                        # Frontend Angular
│   ├── app/
│   │   ├── core/              # Módulos core
│   │   │   ├── guards/        # Route guards
│   │   │   ├── interceptors/  # HTTP interceptors
│   │   │   ├── models/        # Interfaces TypeScript
│   │   │   └── services/      # Serviços Angular
│   │   │
│   │   ├── features/          # Features da aplicação
│   │   │   ├── achievements/  # Sistema de conquistas
│   │   │   ├── admin/         # Painel administrativo
│   │   │   ├── auth/          # Autenticação
│   │   │   ├── gacha/         # Sistema de gacha
│   │   │   └── inventory/     # Inventário
│   │   │
│   │   └── shared/            # Componentes compartilhados
│   │       ├── components/    # Header, cards, etc
│   │       └── pipes/         # Pipes customizados
│   │
│   ├── assets/                # Imagens e recursos
│   └── environments/          # Configurações de ambiente
│
├── shared/                     # Tipos compartilhados
│   └── types.ts               # Interfaces backend/frontend
│
└── README.md                   # Este arquivo
```

Para uma documentação detalhada de cada arquivo, veja: **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)**

---

## 🔥 Features Técnicas

### Performance
- ⚡ **Sistema de Cache**: 30 segundos de cache para inventário e conquistas
- 🚀 **Lazy Loading**: Carregamento sob demanda de módulos
- 📦 **Standalone Components**: Angular 18 com componentes independentes

### Segurança
- 🔐 **Firebase Authentication**: Autenticação segura
- 🛡️ **Guards**: Proteção de rotas
- 🔑 **Middleware de Admin**: Verificação de permissões
- 🚫 **Interceptors**: Tratamento global de erros

### UX/UI
- 🎨 **Animações Suaves**: CSS animations e keyframes
- 💫 **Feedback Visual**: Toasts e notificações
- 🎯 **Responsivo**: Layout adaptável (em desenvolvimento)
- 🌈 **Gradientes Animados**: Especialmente para itens Quantum

---

## 📊 API Endpoints

### Autenticação
```http
POST   /api/auth/register       # Registrar usuário
POST   /api/auth/login          # Login
```

### Boxes
```http
GET    /api/boxes               # Listar todas as boxes
POST   /api/boxes               # Criar box (admin)
PUT    /api/boxes/:id           # Atualizar box (admin)
DELETE /api/boxes/:id           # Deletar box (admin)
```

### Itens
```http
GET    /api/items               # Listar todos os itens
GET    /api/items/box/:boxId    # Itens de uma box
POST   /api/items               # Criar item (admin)
PUT    /api/items/:id           # Atualizar item (admin)
DELETE /api/items/:id           # Deletar item (admin)
```

### Gacha
```http
POST   /api/gacha/pull          # Fazer um pull
GET    /api/gacha/:boxId        # Info da box
```

### Usuário
```http
GET    /api/users               # Listar usuários (admin)
GET    /api/users/:id           # Dados do usuário
GET    /api/users/:id/inventory # Inventário do usuário
```

### Conquistas
```http
GET    /api/achievements/:userId  # Conquistas do usuário
POST   /api/achievements/claim    # Resgatar recompensa
```

---

## 🎨 Screenshots

### Principais Raridades

**Common (Comum)**
- Cor: Azul 
- Efeito: Borda simples
- Probabilidade: 60%

**Legendary (Lendário)**
- Cor: Dourado (#fbbf24)
- Efeito: Brilho rotativo intenso
- Probabilidade: 5%

**Accidental Quantum Existence**
- Cor: Gradiente arco-íris animado
- Efeito: Múltiplas animações simultâneas
- Probabilidade: 0.1%

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se livre para:

1. Fazer fork do projeto
2. Criar uma branch (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: Nova feature incrível'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abrir um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

**Higor Bachião**
- GitHub: [@Higor-Bachiao](https://github.com/Higor-Bachiao)

---


<div align="center">

**⭐ Se você gostou deste projeto, deixe uma estrela! ⭐**



</div>
