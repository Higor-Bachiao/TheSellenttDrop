import * as admin from 'firebase-admin';

const serviceAccount = require('../../serviceAccountKey.json');

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
            