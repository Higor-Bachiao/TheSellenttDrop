import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

// Tentar usar variável de ambiente primeiro (produção)
let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Produção: usar variável de ambiente
  console.log('✅ Usando credenciais do Firebase via variável de ambiente');
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Desenvolvimento: usar arquivo local
  const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log('✅ Usando credenciais do Firebase via arquivo local');
    serviceAccount = require('../../serviceAccountKey.json');
  } else {
    console.error('❌ ERRO: serviceAccountKey.json não encontrado!');
    console.error('👉 Baixe as credenciais do Firebase Console e salve em:', serviceAccountPath);
    console.error('👉 Ou configure a variável de ambiente FIREBASE_SERVICE_ACCOUNT');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

export const auth = admin.auth();
export const firestore = admin.firestore();

export const collections = {
  users: 'users',
  items: 'items',
  userItems: 'userItems',
  achievements: 'achievements',
  userAchievements: 'userAchievements'
};
            