# 📁 Estrutura Detalhada do Projeto

Este documento explica cada pasta e arquivo do projeto **The Sellentt Drop**, suas responsabilidades e como eles se conectam.

---

## 📚 Índice

- [Visão Geral](#-visão-geral)
- [Backend](#-backend)
- [Frontend](#-frontend)
- [Shared](#-shared)
- [Configurações](#-configurações)
- [Fluxo de Dados](#-fluxo-de-dados)

---

## 🌍 Visão Geral

```
TheSellenttDrop-frontend/
├── backend/              # API REST em Node.js + Express
├── src/                  # Frontend Angular
├── shared/               # Tipos compartilhados entre backend e frontend
├── angular.json          # Configuração do Angular CLI
├── package.json          # Dependências do frontend
├── tsconfig.json         # Configuração TypeScript do frontend
└── README.md             # Documentação principal
```

---

## 🔧 Backend

### Estrutura Geral

```
backend/
├── src/
│   ├── config/           # Configurações da aplicação
│   ├── controllers/      # Lógica de negócio
│   ├── middleware/       # Middlewares Express
│   ├── routes/           # Definição de rotas
│   └── server.ts         # Ponto de entrada
├── fix-boxes.js          # Script de manutenção
├── package.json          # Dependências do backend
├── tsconfig.json         # Config TypeScript
└── serviceAccountKey.json # Credenciais Firebase (não versionado)
```

---

### 📂 `backend/src/config/`

#### `firebase.ts`

**Responsabilidade:** Inicializar e exportar instâncias do Firebase Admin SDK.

**O que faz:**
- Inicializa o Firebase Admin com as credenciais do `serviceAccountKey.json`
- Exporta instâncias de `auth` e `db` (Firestore)
- Usado por todos os controllers que precisam acessar o Firebase

**Código Principal:**
```typescript
import admin from 'firebase-admin';
import serviceAccount from '../../serviceAccountKey.json';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export const auth = admin.auth();
export const db = admin.firestore();
```

**Usado por:** Todos os controllers que interagem com o Firestore ou Auth.

---

### 📂 `backend/src/controllers/`

#### `auth.controller.ts`

**Responsabilidade:** Gerenciar registro e login de usuários.

**Endpoints:**
- `POST /api/auth/register` - Criar novo usuário
- `POST /api/auth/login` - Autenticar usuário

**Lógica:**
1. **Register:**
   - Cria usuário no Firebase Auth
   - Cria documento do usuário no Firestore
   - Define `coins: 1000` e `isAdmin: false` por padrão
   - Gera token JWT customizado

2. **Login:**
   - Valida credenciais
   - Busca dados do usuário no Firestore
   - Retorna token JWT com `userId` e `isAdmin`

**Dependências:**
- `firebase.ts` (auth, db)

---

#### `box.controller.ts`

**Responsabilidade:** CRUD completo de boxes (caixas de gacha).

**Endpoints:**
- `GET /api/boxes` - Listar todas as boxes
- `GET /api/boxes/:id` - Detalhes de uma box
- `POST /api/boxes` - Criar box (admin)
- `PUT /api/boxes/:id` - Atualizar box (admin)
- `DELETE /api/boxes/:id` - Deletar box e seus itens (admin)

**Lógica Especial:**
- Ao listar boxes, conta automaticamente quantos itens cada box tem
- Ao deletar uma box, remove todos os itens associados
- Valida que admin está fazendo operações sensíveis

**Estrutura de Box:**
```typescript
{
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  itemCount: number; // Calculado dinamicamente
}
```

**Dependências:**
- `firebase.ts` (db)
- `auth.middleware.ts`
- `requireAdmin.middleware.ts`

---

#### `item.controller.ts`

**Responsabilidade:** CRUD de itens que ficam dentro das boxes.

**Endpoints:**
- `GET /api/items` - Listar todos os itens
- `GET /api/items/box/:boxId` - Itens de uma box específica
- `POST /api/items` - Criar item (admin)
- `PUT /api/items/:id` - Atualizar item (admin)
- `DELETE /api/items/:id` - Deletar item (admin)

**Raridades Suportadas:**
- `comum` (60%)
- `raro` (25%)
- `epico` (10%)
- `lendario` (5%)
- `quantum` (0.1%)

**Estrutura de Item:**
```typescript
{
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: Rarity;
  boxId: string;
  createdAt: Timestamp;
}
```

**Dependências:**
- `firebase.ts` (db)
- `auth.middleware.ts`
- `requireAdmin.middleware.ts`

---

#### `gacha.controller.ts`

**Responsabilidade:** Sistema de pull (sorteio) de itens.

**Endpoints:**
- `POST /api/gacha/pull` - Fazer um pull
- `GET /api/gacha/:boxId` - Informações da box

**Lógica de Pull:**
1. Verifica se usuário tem moedas suficientes
2. Busca todos os itens da box
3. Sorteia item baseado nas probabilidades:
   ```
   0-60: Comum
   60-85: Raro
   85-95: Épico
   95-99.9: Lendário
   99.9-100: Quantum
   ```
4. Debita moedas do usuário
5. Adiciona item ao inventário do usuário
6. Atualiza estatísticas (`totalPulls`, `totalSpent`)
7. Verifica e atualiza conquistas automaticamente

**Cálculo de Probabilidade:**
```typescript
const roll = Math.random() * 100;

if (roll < 60) rarity = 'comum';
else if (roll < 85) rarity = 'raro';
else if (roll < 95) rarity = 'epico';
else if (roll < 99.9) rarity = 'lendario';
else rarity = 'quantum';
```

**Dependências:**
- `firebase.ts` (db)
- `auth.middleware.ts`
- `achievement.controller.ts` (checkAchievements)

---

#### `user.controller.ts`

**Responsabilidade:** Gerenciar dados de usuários.

**Endpoints:**
- `GET /api/users` - Listar todos os usuários (admin)
- `GET /api/users/:id` - Dados de um usuário
- `GET /api/users/:id/inventory` - Inventário do usuário

**Lógica de Inventário:**
1. Busca todos os documentos em `userItems` do usuário
2. Para cada item, busca detalhes completos da coleção `items`
3. Agrupa por `itemId` e soma quantidades
4. Retorna array com itens completos + quantidade

**Estrutura de Inventário:**
```typescript
{
  itemId: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: string;
  quantity: number;
  acquiredAt: Timestamp; // Primeira aquisição
}
```

**Dependências:**
- `firebase.ts` (db)
- `auth.middleware.ts`
- `requireAdmin.middleware.ts` (só para listar todos)

---

#### `achievement.controller.ts`

**Responsabilidade:** Sistema completo de conquistas.

**Endpoints:**
- `GET /api/achievements/:userId` - Conquistas do usuário
- `POST /api/achievements/claim` - Resgatar recompensa

**16 Conquistas Implementadas:**

| ID | Nome | Condição | Recompensa |
|----|------|----------|------------|
| `primeira-colecao` | Primeira Coleção | 1 item | 50 moedas |
| `colecionador-iniciante` | Colecionador Iniciante | 10 itens | 100 moedas |
| `colecionador-experiente` | Colecionador Experiente | 50 itens | 250 moedas |
| `mestre-colecionador` | Mestre Colecionador | 100 itens | 500 moedas |
| `sortudo` | Sortudo | 1 item raro | 75 moedas |
| `muito-sortudo` | Muito Sortudo | 1 item épico | 150 moedas |
| `extremamente-sortudo` | Extremamente Sortudo | 1 item lendário | 300 moedas |
| `existencia-quantica` | Existência Quântica | 1 item quantum | 1000 moedas |
| `primeiro-pull` | Primeiro Pull | 1 pull | 25 moedas |
| `pull-entusiasta` | Pull Entusiasta | 10 pulls | 100 moedas |
| `pull-fanatico` | Pull Fanático | 50 pulls | 300 moedas |
| `mestre-do-gacha` | Mestre do Gacha | 100 pulls | 750 moedas |
| `gastador` | Gastador | 1000 moedas gastas | 200 moedas |
| `grande-gastador` | Grande Gastador | 5000 moedas gastas | 500 moedas |
| `mega-gastador` | Mega Gastador | 10000 moedas gastas | 1000 moedas |
| `diversidade` | Diversidade | 1 de cada raridade | 500 moedas |

**Função `checkAchievements(userId)`:**

Chamada automaticamente após cada pull. Verifica:
1. Quantos itens o usuário tem
2. Quantos pulls fez
3. Quantas moedas gastou
4. Quais raridades possui

Atualiza progresso de todas as conquistas relevantes.

**Função `getUserAchievements(userId)`:**

- Busca conquistas do usuário no Firestore
- Se não existir, cria automaticamente com progresso 0
- Retorna array com todas as 16 conquistas

**Função `claimReward(userId, achievementId)`:**

1. Verifica se conquista está completa e não resgatada
2. Adiciona moedas ao usuário (`FieldValue.increment`)
3. Marca como resgatada
4. Retorna novas moedas do usuário

**Dependências:**
- `firebase.ts` (db)
- `auth.middleware.ts`

---

### 📂 `backend/src/middleware/`

#### `auth.middleware.ts`

**Responsabilidade:** Validar token JWT em rotas protegidas.

**Como funciona:**
1. Extrai token do header `Authorization: Bearer <token>`
2. Verifica o token usando Firebase Admin Auth
3. Adiciona `userId` ao `req` para uso nos controllers
4. Se token inválido, retorna erro 401

**Uso:**
```typescript
router.get('/protected', authenticateToken, (req, res) => {
  const userId = req.userId; // Disponível após middleware
});
```

**Dependências:**
- `firebase.ts` (auth)

---

#### `requireAdmin.middleware.ts`

**Responsabilidade:** Verificar se usuário é admin.

**Como funciona:**
1. Requer `authenticateToken` antes
2. Busca documento do usuário no Firestore
3. Verifica se `isAdmin: true`
4. Se não for admin, retorna erro 403

**Uso:**
```typescript
router.post('/admin-only', authenticateToken, requireAdmin, (req, res) => {
  // Apenas admins chegam aqui
});
```

**Dependências:**
- `firebase.ts` (db)
- `auth.middleware.ts`

---

### 📂 `backend/src/routes/`

Cada arquivo de rota define os endpoints de uma feature específica.

#### `auth.routes.ts`

**Rotas:**
- `POST /api/auth/register`
- `POST /api/auth/login`

**Características:**
- Rotas públicas (sem autenticação)
- Usa `auth.controller.ts`

---

#### `box.routes.ts`

**Rotas:**
- `GET /api/boxes` - Pública (autenticada)
- `GET /api/boxes/:id` - Pública (autenticada)
- `POST /api/boxes` - Admin
- `PUT /api/boxes/:id` - Admin
- `DELETE /api/boxes/:id` - Admin

**Middlewares:**
- `authenticateToken` em todas
- `requireAdmin` em POST, PUT, DELETE

---

#### `item.routes.ts`

**Rotas:**
- `GET /api/items` - Pública (autenticada)
- `GET /api/items/box/:boxId` - Pública (autenticada)
- `POST /api/items` - Admin
- `PUT /api/items/:id` - Admin
- `DELETE /api/items/:id` - Admin

---

#### `gacha.routes.ts`

**Rotas:**
- `POST /api/gacha/pull` - Autenticada
- `GET /api/gacha/:boxId` - Autenticada

---

#### `user.routes.ts`

**Rotas:**
- `GET /api/users` - Admin
- `GET /api/users/:id` - Autenticada (próprio usuário ou admin)
- `GET /api/users/:id/inventory` - Autenticada

---

#### `achievement.routes.ts`

**Rotas:**
- `GET /api/achievements/:userId` - Autenticada
- `POST /api/achievements/claim` - Autenticada

---

### 📄 `backend/src/server.ts`

**Responsabilidade:** Ponto de entrada do backend.

**O que faz:**
1. Inicializa Express
2. Configura middlewares:
   - `cors()` - Permite requisições do frontend
   - `express.json()` - Parse de JSON
3. Registra todas as rotas
4. Inicia servidor na porta 3000

**Código:**
```typescript
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import boxRoutes from './routes/box.routes';
// ... outras rotas

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/boxes', boxRoutes);
// ... outras rotas

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

---

### 📄 `backend/fix-boxes.js`

**Responsabilidade:** Script de manutenção para corrigir dados.

**O que faz:**
- Atualiza boxes que não têm `itemCount`
- Conta itens de cada box
- Atualiza documentos no Firestore

**Uso:**
```bash
node fix-boxes.js
```

---

## 🎨 Frontend

### Estrutura Geral

```
src/
├── app/
│   ├── core/             # Módulos fundamentais
│   ├── features/         # Features da aplicação
│   ├── shared/           # Componentes compartilhados
│   ├── app.component.*   # Componente raiz
│   ├── app.config.ts     # Configuração da app
│   └── app.routes.ts     # Rotas principais
├── assets/               # Arquivos estáticos
├── environments/         # Configurações de ambiente
├── index.html            # HTML principal
├── main.ts               # Bootstrap da aplicação
└── styles.css            # Estilos globais
```

---

### 📂 `src/app/core/`

Módulos fundamentais que são usados em toda a aplicação.

---

#### 📂 `core/guards/`

**Responsabilidade:** Proteção de rotas.

##### `auth.guard.ts`

**O que faz:**
- Verifica se usuário está autenticado
- Redireciona para `/auth/login` se não estiver
- Usa `AuthService.isAuthenticated()`

**Uso em rotas:**
```typescript
{
  path: 'gacha',
  canActivate: [authGuard],
  component: GachaComponent
}
```

---

##### `admin.guard.ts`

**O que faz:**
- Verifica se usuário é admin
- Redireciona para `/gacha` se não for admin
- Usa `AuthService.isAdmin()`

**Uso em rotas:**
```typescript
{
  path: 'admin',
  canActivate: [authGuard, adminGuard],
  loadChildren: () => import('./admin/admin.routes')
}
```

---

#### 📂 `core/interceptors/`

**Responsabilidade:** Interceptar requisições HTTP globalmente.

##### `auth.interceptor.ts`

**O que faz:**
1. Intercepta toda requisição HTTP
2. Adiciona header `Authorization: Bearer <token>`
3. Pega token do `localStorage`

**Código:**
```typescript
intercept(req: HttpRequest<any>, next: HttpHandler) {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  return next.handle(req);
}
```

**Configurado em:** `app.config.ts`

---

##### `error.interceptor.ts`

**O que faz:**
1. Intercepta erros HTTP
2. Mostra mensagens amigáveis via `ToastService`
3. Faz logout se erro 401 (não autorizado)

**Erros tratados:**
- 400: Bad Request
- 401: Unauthorized (logout automático)
- 403: Forbidden
- 404: Not Found
- 500: Server Error

---

#### 📂 `core/models/`

**Responsabilidade:** Definir interfaces TypeScript.

##### `user.model.ts`

```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  coins: number;
  isAdmin: boolean;
  totalPulls?: number;
  totalSpent?: number;
}
```

---

##### `gacha.model.ts`

```typescript
export interface Box {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  itemCount?: number;
}
```

---

##### `item.model.ts`

```typescript
export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario' | 'quantum';

export interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: Rarity;
  boxId: string;
  quantity?: number;
  acquiredAt?: any;
}
```

---

##### `achievement.model.ts`

```typescript
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
  condition: number;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}
```

---

##### `api.model.ts`

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
```

---

#### 📂 `core/services/`

**Responsabilidade:** Lógica de negócio e comunicação com API.

##### `auth.service.ts`

**Responsabilidade:** Autenticação e gerenciamento de sessão.

**Métodos Principais:**

```typescript
register(email, password, displayName): Observable<any>
login(email, password): Observable<any>
logout(): void
isAuthenticated(): boolean
isAdmin(): boolean
getCurrentUser(): User | null
```

**O que faz:**
- Faz requisições para `/api/auth/register` e `/api/auth/login`
- Armazena token e usuário no `localStorage`
- Fornece BehaviorSubject `currentUser$` para reatividade
- Decodifica JWT para extrair dados do usuário

**Usado por:**
- Componentes de autenticação
- Guards
- Header (mostrar nome do usuário)

---

##### `gacha.service.ts`

**Responsabilidade:** Operações relacionadas ao gacha.

**Métodos Principais:**

```typescript
getAllBoxes(): Observable<Box[]>
getBox(boxId: string): Observable<Box>
pullGacha(boxId: string): Observable<PullResult>
createBox(box: Box): Observable<any>  // Admin
updateBox(id: string, box: Box): Observable<any>  // Admin
deleteBox(id: string): Observable<any>  // Admin
```

**Cache:** Não implementado (sempre busca da API).

**Usado por:**
- `GachaMainComponent` (listar boxes)
- `GachaRollComponent` (fazer pull)
- `BoxManagementComponent` (admin)

---

##### `item.service.ts`

**Responsabilidade:** Gerenciar itens e inventário.

**Métodos Principais:**

```typescript
getUserInventory(forceRefresh?: boolean): Observable<Item[]>
getInventoryCache(): Observable<Item[]>
invalidateCache(): void
getAllItems(): Observable<Item[]>
getItemsByBox(boxId: string): Observable<Item[]>
createItem(item: Item): Observable<any>  // Admin
updateItem(id: string, item: Item): Observable<any>  // Admin
deleteItem(id: string): Observable<any>  // Admin
```

**Sistema de Cache:**
- Usa `BehaviorSubject` para cache em memória
- Cache válido por 30 segundos
- Método `invalidateCache()` para forçar refresh
- Automaticamente atualizado após pull

**Código de Cache:**
```typescript
private inventoryCache$ = new BehaviorSubject<Item[] | null>(null);
private cacheTimestamp = 0;
private CACHE_DURATION = 30000; // 30 segundos

getUserInventory(forceRefresh = false): Observable<Item[]> {
  const now = Date.now();
  const cacheValid = (now - this.cacheTimestamp) < this.CACHE_DURATION;
  
  if (!forceRefresh && cacheValid && this.inventoryCache$.value) {
    return this.inventoryCache$.asObservable();
  }
  
  return this.http.get<Item[]>(`${API_URL}/inventory`).pipe(
    tap(items => {
      this.inventoryCache$.next(items);
      this.cacheTimestamp = now;
    })
  );
}
```

**Usado por:**
- `InventoryMainComponent`
- `GachaRollComponent` (invalida cache após pull)

---

##### `achievement.service.ts`

**Responsabilidade:** Gerenciar conquistas.

**Métodos Principais:**

```typescript
getUserAchievements(forceRefresh?: boolean): Observable<Achievement[]>
invalidateCache(): void
claimReward(achievementId: string): Observable<any>
```

**Sistema de Cache:**
- Similar ao `item.service.ts`
- Cache de 30 segundos
- Invalida após resgatar recompensa

**Usado por:**
- `AchievementsMainComponent`
- `GachaRollComponent` (invalida cache após pull)

---

##### `user.service.ts`

**Responsabilidade:** Operações com usuários.

**Métodos Principais:**

```typescript
getAllUsers(): Observable<User[]>  // Admin
getUser(userId: string): Observable<User>
updateUserCoins(userId: string, coins: number): Observable<any>
```

**Usado por:**
- Admin components
- Header (mostrar moedas atualizadas)

---

##### `notification.service.ts`

**Responsabilidade:** Sistema de notificações (não usado atualmente).

**Nota:** Substituído pelo `ToastService` na prática.

---

##### `toast.service.ts`

**Responsabilidade:** Exibir mensagens temporárias.

**Métodos:**

```typescript
show(message: string, type: 'success' | 'error' | 'info'): void
```

**Como funciona:**
1. Adiciona mensagem ao array `toasts$`
2. `ToastContainerComponent` subscreve e mostra
3. Auto-remove após 3 segundos

**Usado por:**
- `ErrorInterceptor` (erros HTTP)
- Componentes (sucesso em operações)

---

##### `loading.service.ts`

**Responsabilidade:** Controlar estado de loading global.

**Métodos:**

```typescript
show(): void
hide(): void
isLoading$: Observable<boolean>
```

**Usado por:**
- `LoaderComponent` (mostra spinner)
- Componentes (durante operações assíncronas)

---

##### `api.service.ts`

**Responsabilidade:** Cliente HTTP genérico (não muito usado).

**Nota:** Serviços específicos (gacha, item, etc.) fazem requisições diretas com `HttpClient`.

---

### 📂 `src/app/features/`

Features isoladas da aplicação. Cada feature tem sua própria pasta com:
- `pages/` - Componentes de página
- `*.routes.ts` - Rotas da feature

---

#### 📂 `features/auth/`

**Responsabilidade:** Sistema de autenticação.

##### `pages/login/`

**Componente:** `LoginComponent`

**O que faz:**
- Formulário de login (email + senha)
- Chama `AuthService.login()`
- Redireciona para `/gacha` após sucesso
- Link para registro

**Template:**
```html
<form (ngSubmit)="onLogin()">
  <input [(ngModel)]="email" type="email" required>
  <input [(ngModel)]="password" type="password" required>
  <button type="submit">Entrar</button>
</form>
```

---

##### `pages/register/`

**Componente:** `RegisterComponent`

**O que faz:**
- Formulário de registro (email + senha + nome)
- Chama `AuthService.register()`
- Redireciona para `/gacha` após sucesso
- Link para login

---

#### 📂 `features/gacha/`

**Responsabilidade:** Sistema principal do gacha.

##### `pages/gacha-main/`

**Componente:** `GachaMainComponent`

**O que faz:**
- Lista todas as boxes disponíveis
- Cards clicáveis com hover effects
- Mostra nome, descrição, custo e quantidade de itens
- Navega para `/gacha/roll?boxId=xxx` ao clicar

**Estilo:**
```css
.box-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.box-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
```

---

##### `pages/gacha-roll/`

**Componente:** `GachaRollComponent`

**Responsabilidade:** Fazer pulls e exibir slot machine.

**Funcionamento da Animação:**

1. **Preparação:**
   ```typescript
   rollGacha() {
     // Gera array de 50 itens aleatórios
     this.generatedItems = this.generateRandomItems(50);
     
     // Faz requisição ao backend
     this.gachaService.pullGacha(boxId).subscribe(result => {
       this.wonItem = result.item;
       // Adiciona item ganho no meio do array
       this.generatedItems[25] = result.item;
       this.startAnimation();
     });
   }
   ```

2. **Animação (3 fases):**
   
   **Fase 1 - Fast Spin (2s):**
   ```typescript
   animateFastSpin() {
     const duration = 2000;
     const startTime = Date.now();
     
     const animate = () => {
       const progress = (Date.now() - startTime) / duration;
       this.currentPosition = progress * -5000; // Rola rápido
       
       if (progress < 1) {
         requestAnimationFrame(animate);
       } else {
         this.animateSlowdown();
       }
     };
     
     requestAnimationFrame(animate);
   }
   ```
   
   **Fase 2 - Slowdown (3s com easing):**
   ```typescript
   animateSlowdown() {
     const duration = 3000;
     const startPosition = this.currentPosition;
     const finalPosition = this.calculateFinalPosition();
     
     const animate = () => {
       const progress = easingFunction(elapsed / duration);
       this.currentPosition = lerp(startPosition, finalPosition, progress);
       
       if (progress < 1) {
         requestAnimationFrame(animate);
       } else {
         this.showResult();
       }
     };
     
     requestAnimationFrame(animate);
   }
   ```
   
   **Fase 3 - Pause (2s):**
   ```typescript
   showResult() {
     setTimeout(() => {
       this.isAnimating = false;
       // Mostra modal com resultado
     }, 2000);
   }
   ```

3. **Cálculo da Posição Final:**
   ```typescript
   calculateFinalPosition() {
     // Mede posição do item ganho no DOM
     const itemElement = document.querySelector('.won-item');
     const itemRect = itemElement.getBoundingClientRect();
     
     // Centraliza na tela
     const windowCenterY = window.innerHeight / 2;
     const itemCenterY = itemRect.height / 2;
     
     return windowCenterY - itemCenterY - 5; // -5px ajuste fino
   }
   ```

**Header Animado:**

```html
<div class="box-header">
  <div class="header-glow"></div>
  <div class="title-wrapper">
    <span class="sparkle-left">✨</span>
    <h1 class="gradient-text">{{ box.name }}</h1>
    <span class="sparkle-right">✨</span>
  </div>
  <div class="title-underline"></div>
  <div class="stat-badge">
    🎁 {{ box.itemCount }} itens • 💰 {{ box.cost }} moedas
  </div>
</div>
```

**CSS Animations:**
- `header-glow`: Gradiente rotativo
- `title-sparkle`: Rotação das estrelinhas
- `gradient-text`: Gradiente animado no texto
- `title-underline`: Linha deslizante

**Invalidação de Cache:**
```typescript
onPullSuccess(result) {
  this.itemService.invalidateCache();
  this.achievementService.invalidateCache();
  this.authService.updateCurrentUserCoins(result.userCoins);
}
```

---

#### 📂 `features/inventory/`

##### `pages/inventory-main/`

**Componente:** `InventoryMainComponent`

**Responsabilidade:** Exibir e filtrar inventário do usuário.

**Features:**

1. **Sistema de Filtros:**
   ```typescript
   sortBy: 'date' | 'rarity' | 'quantity' = 'date';
   
   sortItems() {
     switch (this.sortBy) {
       case 'rarity':
         this.filteredItems.sort((a, b) => 
           getRarityOrder(b.rarity) - getRarityOrder(a.rarity)
         );
         break;
       case 'date':
         this.filteredItems.sort((a, b) => 
           getTimestamp(b.acquiredAt) - getTimestamp(a.acquiredAt)
         );
         break;
       case 'quantity':
         this.filteredItems.sort((a, b) => 
           (b.quantity || 0) - (a.quantity || 0)
         );
         break;
     }
   }
   ```

2. **Ordem de Raridade:**
   ```typescript
   getRarityOrder(rarity: string): number {
     const order = {
       'quantum': 5,
       'lendario': 4,
       'epico': 3,
       'raro': 2,
       'comum': 1
     };
     return order[rarity] || 0;
   }
   ```

3. **Suporte a Firestore Timestamp:**
   ```typescript
   getTimestamp(timestamp: any): number {
     if (timestamp?._seconds) {
       return timestamp._seconds * 1000;
     }
     if (timestamp?.toDate) {
       return timestamp.toDate().getTime();
     }
     return new Date(timestamp).getTime();
   }
   ```

**Template:**
```html
<div class="filters">
  <button [class.active]="sortBy === 'date'" 
          (click)="sortBy = 'date'; sortItems()">
    📅 Data
  </button>
  <button [class.active]="sortBy === 'rarity'" 
          (click)="sortBy = 'rarity'; sortItems()">
    ⭐ Raridade
  </button>
  <button [class.active]="sortBy === 'quantity'" 
          (click)="sortBy = 'quantity'; sortItems()">
    🔢 Quantidade
  </button>
</div>

<div class="items-grid">
  <app-item-card *ngFor="let item of filteredItems" 
                 [item]="item">
  </app-item-card>
</div>
```

---

#### 📂 `features/achievements/`

##### `pages/achievements-main/`

**Componente:** `AchievementsMainComponent`

**Responsabilidade:** Exibir conquistas e permitir resgate.

**Features:**

1. **Filtros:**
   ```typescript
   filterBy: 'all' | 'completed' | 'available' = 'all';
   
   filterAchievements() {
     switch (this.filterBy) {
       case 'completed':
         return this.achievements.filter(a => a.completed);
       case 'available':
         return this.achievements.filter(a => 
           a.completed && !a.rewardClaimed
         );
       case 'all':
       default:
         return this.achievements;
     }
   }
   ```

2. **Estatísticas:**
   ```typescript
   get totalCompleted(): number {
     return this.achievements.filter(a => a.completed).length;
   }
   
   get totalRewards(): number {
     return this.achievements
       .filter(a => a.completed && !a.rewardClaimed)
       .reduce((sum, a) => sum + a.reward, 0);
   }
   ```

3. **Resgate de Recompensa:**
   ```typescript
   claimReward(achievement: Achievement) {
     if (!achievement.completed || achievement.rewardClaimed) {
       return;
     }
     
     this.achievementService.claimReward(achievement.id)
       .subscribe(response => {
         achievement.rewardClaimed = true;
         this.authService.updateCurrentUserCoins(response.userCoins);
         this.toastService.show(
           `+${achievement.reward} moedas!`,
           'success'
         );
       });
   }
   ```

**Template:**
```html
<div class="achievement-card" 
     [class.completed]="achievement.completed"
     [class.claimed]="achievement.rewardClaimed">
  
  <div class="icon">{{ achievement.icon }}</div>
  <h3>{{ achievement.name }}</h3>
  <p>{{ achievement.description }}</p>
  
  <div class="progress-bar">
    <div class="fill" 
         [style.width.%]="(achievement.progress / achievement.condition) * 100">
    </div>
  </div>
  
  <div class="stats">
    {{ achievement.progress }} / {{ achievement.condition }}
  </div>
  
  <button *ngIf="achievement.completed && !achievement.rewardClaimed"
          (click)="claimReward(achievement)">
    🎁 Resgatar {{ achievement.reward }} moedas
  </button>
</div>
```

---

#### 📂 `features/admin/`

**Responsabilidade:** Painel administrativo.

##### `pages/box-management/`

**Componente:** `BoxManagementComponent`

**O que faz:**
- Lista todas as boxes
- Formulário para criar/editar boxes
- Upload de imagem (URL)
- Deletar boxes (com confirmação)

**Formulário:**
```typescript
boxForm = {
  name: '',
  description: '',
  imageUrl: '',
  cost: 100
};

saveBox() {
  if (this.editingId) {
    this.gachaService.updateBox(this.editingId, this.boxForm)
      .subscribe(() => this.loadBoxes());
  } else {
    this.gachaService.createBox(this.boxForm)
      .subscribe(() => this.loadBoxes());
  }
}
```

---

##### `pages/item-management/`

**Componente:** `ItemManagementComponent`

**O que faz:**
- Lista todos os itens
- Formulário para criar/editar itens
- Seleciona box associada
- Seleciona raridade
- Upload de imagem (URL)
- Deletar itens (com confirmação)

**Formulário:**
```typescript
itemForm = {
  name: '',
  description: '',
  imageUrl: '',
  rarity: 'comum',
  boxId: ''
};

rarities = ['comum', 'raro', 'epico', 'lendario', 'quantum'];
```

---

### 📂 `src/app/shared/`

Componentes, pipes e utilitários compartilhados.

---

#### 📂 `shared/components/`

##### `header/`

**Componente:** `HeaderComponent`

**Responsabilidade:** Barra de navegação superior.

**O que mostra:**
- Logo/Nome do app
- Nome do usuário logado
- Moedas do usuário (atualizado em tempo real)
- Links de navegação:
  - 🎰 Gacha
  - 📦 Inventário
  - 🏆 Conquistas
  - 👑 Admin (se for admin)
- Botão de logout

**Template:**
```html
<header>
  <div class="logo">🎰 The Sellentt Drop</div>
  
  <nav>
    <a routerLink="/gacha" routerLinkActive="active">🎰 Gacha</a>
    <a routerLink="/inventory" routerLinkActive="active">📦 Inventário</a>
    <a routerLink="/achievements" routerLinkActive="active">🏆 Conquistas</a>
    <a *ngIf="isAdmin" routerLink="/admin" routerLinkActive="active">
      👑 Admin
    </a>
  </nav>
  
  <div class="user-info">
    <span>{{ user?.displayName }}</span>
    <span class="coins">💰 {{ user?.coins }}</span>
    <button (click)="logout()">Sair</button>
  </div>
</header>
```

**Subscrição ao Usuário:**
```typescript
ngOnInit() {
  this.authService.currentUser$.subscribe(user => {
    this.user = user;
    this.isAdmin = this.authService.isAdmin();
  });
}
```

---

##### `item-card/`

**Componente:** `ItemCardComponent`

**Responsabilidade:** Card visual de um item.

**Props:**
```typescript
@Input() item!: Item;
@Input() showQuantity: boolean = true;
```

**Template:**
```html
<div class="item-card" [class]="'rarity-' + item.rarity">
  <img [src]="item.imageUrl" [alt]="item.name">
  
  <div class="info">
    <h3>{{ item.name }}</h3>
    <app-rarity-badge [rarity]="item.rarity"></app-rarity-badge>
    
    <p *ngIf="showQuantity" class="quantity">
      x{{ item.quantity }}
    </p>
  </div>
</div>
```

**Estilos por Raridade:**
```css
.item-card.rarity-comum {
  border-color: #64748b;
}

.item-card.rarity-raro {
  border-color: #3b82f6;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
}

.item-card.rarity-epico {
  border-color: #a855f7;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.4);
}

.item-card.rarity-lendario {
  border-color: #fbbf24;
  box-shadow: 0 0 25px rgba(251, 191, 36, 0.5);
  animation: legendary-glow 2s ease-in-out infinite;
}

.item-card.rarity-quantum {
  border: 3px solid transparent;
  background: 
    linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)) padding-box,
    linear-gradient(45deg, #ff0080, #40e0d0, #7928ca, #00ff88, #ff0080) border-box;
  background-size: 100%, 400% 400%;
  animation: quantum-border 4s linear infinite, quantum-bg 4s ease infinite;
}
```

---

##### `rarity-badge/`

**Componente:** `RarityBadgeComponent`

**Responsabilidade:** Badge de raridade.

**Props:**
```typescript
@Input() rarity!: Rarity;
```

**Template:**
```html
<span class="rarity-badge" [class]="'rarity-' + rarity">
  {{ getRarityLabel(rarity) }}
</span>
```

**Labels:**
```typescript
getRarityLabel(rarity: string): string {
  const labels = {
    'comum': 'Comum',
    'raro': 'Raro',
    'epico': 'Épico',
    'lendario': 'Lendário',
    'quantum': 'Quantum'
  };
  return labels[rarity] || rarity;
}
```

**Estilos:**
```css
.rarity-badge.rarity-quantum {
  border: 2px solid transparent;
  background: 
    linear-gradient(#1a1a1a, #1a1a1a) padding-box,
    linear-gradient(45deg, #ff0080, #40e0d0, #7928ca, #00ff88) border-box;
  background-size: 100%, 400% 400%;
  animation: quantum-badge 3s ease infinite;
  border-radius: 9999px;
}
```

---

##### `loader/`

**Componente:** `LoaderComponent`

**Responsabilidade:** Spinner de loading global.

**Template:**
```html
<div class="loader-overlay" *ngIf="loadingService.isLoading$ | async">
  <div class="spinner"></div>
</div>
```

**CSS:**
```css
.loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-top: 4px solid #fff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}
```

---

##### `toast-container/`

**Componente:** `ToastContainerComponent`

**Responsabilidade:** Exibir toasts de notificação.

**Template:**
```html
<div class="toast-container">
  <div *ngFor="let toast of toastService.toasts$ | async"
       class="toast"
       [class]="'toast-' + toast.type">
    {{ toast.message }}
  </div>
</div>
```

**Auto-remove:**
```typescript
ngOnInit() {
  this.toastService.toasts$.subscribe(toasts => {
    toasts.forEach(toast => {
      setTimeout(() => {
        this.toastService.remove(toast.id);
      }, 3000);
    });
  });
}
```

---

##### `main-layout/`

**Componente:** `MainLayoutComponent`

**Responsabilidade:** Layout base da aplicação autenticada.

**Template:**
```html
<div class="main-layout">
  <app-header></app-header>
  
  <main>
    <router-outlet></router-outlet>
  </main>
  
  <app-toast-container></app-toast-container>
  <app-loader></app-loader>
</div>
```

**Usado por:** `app.routes.ts` como wrapper de rotas autenticadas.

---

#### 📂 `shared/pipes/`

Pipes customizados para transformação de dados nos templates.

---

### 📄 Arquivos de Configuração Principal

#### `src/app/app.routes.ts`

**Responsabilidade:** Definir estrutura de rotas da aplicação.

**Estrutura:**
```typescript
export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'gacha', pathMatch: 'full' },
      { path: 'gacha', loadChildren: () => import('./features/gacha/gacha.routes') },
      { path: 'inventory', component: InventoryMainComponent },
      { path: 'achievements', component: AchievementsMainComponent },
      { 
        path: 'admin', 
        canActivate: [adminGuard],
        loadChildren: () => import('./features/admin/admin.routes') 
      }
    ]
  },
  { path: '**', redirectTo: 'gacha' }
];
```

---

#### `src/app/app.config.ts`

**Responsabilidade:** Configurar providers da aplicação.

**Providers:**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor
      ])
    ),
    provideAnimations(),
    
    // Services
    AuthService,
    GachaService,
    ItemService,
    AchievementService,
    UserService,
    ToastService,
    LoadingService
  ]
};
```

---

#### `src/main.ts`

**Responsabilidade:** Bootstrap da aplicação Angular.

**Código:**
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
```

---

#### `src/app/app.component.ts`

**Componente Raiz:**

```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {}
```

---

#### `src/styles.css`

**Responsabilidade:** Estilos globais da aplicação.

**Inclui:**
- Reset CSS
- Variáveis CSS para cores e temas
- Animações globais (@keyframes)
- Estilos de scrollbar

**Exemplo:**
```css
:root {
  --color-bg: #0a0a0a;
  --color-surface: #1a1a1a;
  --color-primary: #3b82f6;
  --color-success: #10b981;
  --color-error: #ef4444;
  
  --rarity-comum: #64748b;
  --rarity-raro: #3b82f6;
  --rarity-epico: #a855f7;
  --rarity-lendario: #fbbf24;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: var(--color-bg);
  color: white;
}
```

---

### 📂 `src/environments/`

#### `environment.ts` (Desenvolvimento)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  firebase: {
    apiKey: 'your-api-key',
    authDomain: 'your-project.firebaseapp.com',
    projectId: 'your-project-id',
    // ...
  }
};
```

#### `environment.prod.ts` (Produção)

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourapp.com/api',
  firebase: {
    // Configurações de produção
  }
};
```

---

## 🔗 Shared

### `shared/types.ts`

**Responsabilidade:** Interfaces TypeScript compartilhadas entre backend e frontend.

**Vantagem:** Type safety em toda a aplicação.

**Conteúdo:**
```typescript
export type Rarity = 'comum' | 'raro' | 'epico' | 'lendario' | 'quantum';

export interface User {
  id: string;
  email: string;
  displayName: string;
  coins: number;
  isAdmin: boolean;
}

export interface Box {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  cost: number;
  itemCount?: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: Rarity;
  boxId: string;
  quantity?: number;
  acquiredAt?: any;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
  condition: number;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}
```

---

## ⚙️ Configurações

### `angular.json`

**Responsabilidade:** Configuração do Angular CLI.

**Principais seções:**
- `projects`: Configuração do projeto
- `architect.build`: Configuração de build
- `architect.serve`: Configuração do dev server
- `architect.test`: Configuração de testes

---

### `tsconfig.json` (raiz)

**Responsabilidade:** Configuração TypeScript do frontend.

**Principais opções:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  }
}
```

---

### `package.json` (raiz)

**Scripts:**
```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test"
  }
}
```

---

### `backend/tsconfig.json`

**Responsabilidade:** Configuração TypeScript do backend.

**Diferenças do frontend:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

---

## 🔄 Fluxo de Dados

### Pull de Gacha (Fluxo Completo)

```
1. User clica em "Pull" no frontend
   ↓
2. GachaRollComponent.rollGacha()
   ↓
3. GachaService.pullGacha(boxId)
   ↓
4. HTTP POST /api/gacha/pull
   ↓
5. AuthInterceptor adiciona token
   ↓
6. Backend: authenticateToken middleware
   ↓
7. Backend: gacha.controller.pull()
   ├─ Verifica moedas do usuário
   ├─ Busca itens da box
   ├─ Sorteia item (probabilidade por raridade)
   ├─ Debita moedas
   ├─ Adiciona item ao inventário
   ├─ Atualiza estatísticas (totalPulls, totalSpent)
   └─ Chama checkAchievements(userId)
   ↓
8. Resposta JSON com item ganho
   ↓
9. Frontend recebe resultado
   ↓
10. GachaRollComponent
    ├─ Inicia animação da slot machine
    ├─ Invalida cache de inventário
    ├─ Invalida cache de conquistas
    └─ Atualiza moedas do usuário
    ↓
11. Após animação, mostra modal com item ganho
```

---

### Autenticação (Fluxo)

```
1. User submete formulário de login
   ↓
2. LoginComponent.onLogin()
   ↓
3. AuthService.login(email, password)
   ↓
4. HTTP POST /api/auth/login
   ↓
5. Backend: auth.controller.login()
   ├─ Valida credenciais no Firebase Auth
   ├─ Busca dados do usuário no Firestore
   ├─ Gera token JWT customizado
   └─ Retorna { token, user }
   ↓
6. Frontend: AuthService
   ├─ Salva token no localStorage
   ├─ Salva user no localStorage
   ├─ Emite novo valor em currentUser$
   └─ Retorna observable
   ↓
7. LoginComponent
   ├─ Subscreve ao observable
   ├─ Mostra toast de sucesso
   └─ Navega para /gacha
   ↓
8. Todas as requisições subsequentes
   incluem o token automaticamente
   via AuthInterceptor
```

---

### Cache de Inventário (Fluxo)

```
1. User navega para /inventory
   ↓
2. InventoryMainComponent.ngOnInit()
   ↓
3. ItemService.getUserInventory()
   ├─ Verifica se cache é válido
   ├─ Se válido: retorna BehaviorSubject
   └─ Se inválido: faz HTTP request
   ↓
4. HTTP GET /api/users/:id/inventory
   ↓
5. Backend retorna array de itens
   ↓
6. ItemService
   ├─ Atualiza inventoryCache$
   ├─ Atualiza cacheTimestamp
   └─ Retorna observable
   ↓
7. Component recebe itens e renderiza
   ↓
8. User faz um pull em outra aba
   ↓
9. GachaRollComponent.onPullSuccess()
   ↓
10. ItemService.invalidateCache()
    ├─ Define cacheTimestamp = 0
    └─ Próxima leitura forçará nova requisição
```

---

## 🎓 Conceitos Importantes

### Standalone Components (Angular 18)

Este projeto usa standalone components, que NÃO precisam de NgModule:

```typescript
@Component({
  selector: 'app-example',
  standalone: true,  // ← Componente independente
  imports: [CommonModule, FormsModule],  // ← Imports diretos
  template: `...`
})
export class ExampleComponent {}
```

---

### Firebase Admin SDK

Usado apenas no backend para:
- Criar/validar tokens JWT
- Acessar Firestore sem autenticação de usuário
- Operações administrativas

**Nunca** use Firebase Admin SDK no frontend!

---

### Firestore Timestamps

Firestore retorna timestamps em dois formatos:

1. **Objeto Firebase:**
   ```typescript
   {
     _seconds: 1702653000,
     _nanoseconds: 123456789
   }
   ```

2. **Timestamp com método:**
   ```typescript
   {
     toDate(): Date
   }
   ```

Por isso precisamos do helper:
```typescript
getTimestamp(timestamp: any): number {
  if (timestamp?._seconds) {
    return timestamp._seconds * 1000;
  }
  if (timestamp?.toDate) {
    return timestamp.toDate().getTime();
  }
  return new Date(timestamp).getTime();
}
```

---

### CSS Gradientes com Border-Radius

Para borders animados que respeitam `border-radius`:

**❌ NÃO funciona:**
```css
.card {
  border-image: linear-gradient(...) 1;
  border-radius: 10px; /* Ignorado! */
}
```

**✅ FUNCIONA:**
```css
.card {
  border: 3px solid transparent;
  background: 
    linear-gradient(#1a1a1a, #1a1a1a) padding-box,
    linear-gradient(45deg, #ff0080, #40e0d0) border-box;
  border-radius: 10px;
}
```

---

## 🎯 Resumo das Responsabilidades

| Camada | Responsabilidade |
|--------|------------------|
| **Backend Controllers** | Lógica de negócio, validações, banco de dados |
| **Backend Middleware** | Autenticação, autorização, logs |
| **Backend Routes** | Mapeamento de URLs para controllers |
| **Frontend Services** | Comunicação com API, cache, estado |
| **Frontend Guards** | Proteção de rotas |
| **Frontend Interceptors** | Modificação de requisições/respostas |
| **Frontend Components** | UI e interação com usuário |
| **Shared Types** | Contratos entre backend e frontend |

---

## 📚 Palavras-Chave para Busca

- **Autenticação**: `auth.service.ts`, `auth.controller.ts`, `auth.middleware.ts`
- **Gacha/Pull**: `gacha.controller.ts`, `gacha-roll.component.ts`
- **Inventário**: `item.service.ts`, `user.controller.ts`, `inventory-main.component.ts`
- **Conquistas**: `achievement.controller.ts`, `achievement.service.ts`
- **Admin**: `admin/`, `requireAdmin.middleware.ts`
- **Cache**: `item.service.ts`, `achievement.service.ts` (BehaviorSubject)
- **Animações**: `gacha-roll.component.css`, `item-card.component.css`
- **Raridades**: `types.ts`, `gacha.controller.ts` (probabilidades)

---

<div align="center">

**📖 Este documento cobre 100% da estrutura do projeto!**

Se tiver dúvidas sobre algum arquivo específico, consulte esta documentação. ✨

Feito com ❤️ para facilitar o entendimento do projeto

</div>
