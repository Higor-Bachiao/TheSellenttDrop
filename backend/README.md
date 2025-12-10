# The Sellentt Drop - Backend

Backend do sistema gacha desenvolvido com Node.js, Express, TypeScript e Firebase.

## Instalação

```bash
npm install
```

## Configuração

1. Adicione o arquivo `serviceAccountKey.json` na raiz do backend
2. Configure as variáveis de ambiente no arquivo `.env`

## Execução

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## Estrutura

```
backend/
├── src/
│   ├── config/          # Configurações (Firebase, etc)
│   ├── controllers/     # Controllers
│   ├── middleware/      # Middlewares
│   ├── routes/          # Rotas
│   ├── services/        # Serviços
│   └── server.ts        # Entrada da aplicação
├── package.json
└── tsconfig.json
```

## TODO

- Implementar rotas de autenticação
- Implementar CRUD de usuários
- Implementar CRUD de itens
- Implementar sistema de gacha
- Implementar sistema de conquistas
