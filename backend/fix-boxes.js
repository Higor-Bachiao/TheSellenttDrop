const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

(async () => {
  console.log('🔧 Corrigindo boxes sem campo id...');
  const boxesSnapshot = await db.collection('boxes').get();
  
  const batch = db.batch();
  let count = 0;
  
  boxesSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.id) {
      console.log('Atualizando box:', doc.id, '-', data.name);
      batch.update(doc.ref, { id: doc.id });
      count++;
    } else {
      console.log('Box já tem id:', data.id, '-', data.name);
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`✅ ${count} box(es) atualizada(s) com sucesso!`);
  } else {
    console.log('✅ Todas as boxes já têm o campo id!');
  }
  
  // Listar todas as boxes após correção
  console.log('\n📦 BOXES ATUALIZADAS:');
  const updatedBoxes = await db.collection('boxes').get();
  updatedBoxes.forEach(doc => {
    const data = doc.data();
    console.log(`- ID: ${data.id}, Nome: ${data.name}`);
  });
  
  process.exit(0);
})();
