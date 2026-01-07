# 🔑 Como Configurar Firebase Credentials

## Desenvolvimento Local

1. **Baixe as credenciais do Firebase:**
   - Acesse: https://console.firebase.google.com
   - Selecione o projeto: `the-sellentt-drop`
   - Vá em ⚙️ **Project Settings** → **Service Accounts**
   - Clique em **Generate New Private Key**
   - Baixe o arquivo JSON

2. **Salve na pasta backend:**
   ```bash
   mv ~/Downloads/the-sellentt-drop-*.json serviceAccountKey.json
   ```

3. **Verifique se está no .gitignore:**
   O arquivo `serviceAccountKey.json` já está no `.gitignore` e **nunca deve ser commitado**!

4. **Execute o servidor:**
   ```bash
   npm run dev
   ```

## Produção (Render/Vercel/Railway)

1. **No painel da plataforma, adicione a variável de ambiente:**
   - Nome: `FIREBASE_SERVICE_ACCOUNT`
   - Valor: Cole o conteúdo completo do arquivo `serviceAccountKey.json` (todo o JSON como uma string)

2. **O código irá detectar automaticamente e usar a variável de ambiente**

## Troubleshooting

### Erro: "Cannot find module '../../serviceAccountKey.json'"

**Causa:** O arquivo não existe na pasta `backend/`

**Solução:** 
1. Baixe as credenciais do Firebase Console (veja instruções acima)
2. Ou configure a variável de ambiente `FIREBASE_SERVICE_ACCOUNT`

### Erro: "Credential implementation provided to initializeApp() via the 'credential' property failed"

**Causa:** JSON inválido ou credenciais incorretas

**Solução:**
1. Re-baixe as credenciais do Firebase
2. Verifique se o arquivo não está corrompido
3. Certifique-se de estar usando o projeto correto (`the-sellentt-drop`)
