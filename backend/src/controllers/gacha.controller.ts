import { Request, Response } from 'express';
import { auth, firestore, collections } from '../config/firebase';

// Rolar o gacha
export async function rollGacha(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { boxId = 'box-inicial' } = req.body;

    // Buscar box
    const boxDoc = await firestore.collection('boxes').doc(boxId).get();
    if (!boxDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Box não encontrada'
      });
    }

    const box = boxDoc.data();
    const boxCost = box?.cost || 100;

    // Buscar usuário
    const userRef = firestore.collection(collections.users).doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const userData = userDoc.data();
    const userCoins = userData?.coins || 0;

    // Verificar se tem moedas suficientes
    if (userCoins < boxCost) {
      return res.status(400).json({
        success: false,
        error: `Moedas insuficientes. Você tem ${userCoins}, mas precisa de ${boxCost}.`
      });
    }

    // Buscar itens da box
    const itemsSnapshot = await firestore
      .collection(collections.items)
      .where('boxId', '==', boxId)
      .get();

    if (itemsSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Nenhum item encontrado nesta box'
      });
    }

    const items = itemsSnapshot.docs.map(doc => doc.data());

    // Calcular probabilidades e selecionar item
    const selectedItem = selectRandomItem(items);

    if (!selectedItem) {
      return res.status(500).json({
        success: false,
        error: 'Erro ao selecionar item'
      });
    }

    // Calcular raridade específica (1-1000)
    const rarityValue = calculateRarityValue(selectedItem.rarity);

    // Criar UserItem
    const userItemId = `user-item-${Date.now()}`;
    const userItemData = {
      id: userItemId,
      userId,
      itemId: selectedItem.id,
      quantity: 1,
      rarity: rarityValue,
      obtainedAt: new Date()
    };

    // Verificar se usuário já tem este item
    const existingItemsSnapshot = await firestore
      .collection(collections.userItems)
      .where('userId', '==', userId)
      .where('itemId', '==', selectedItem.id)
      .get();

    const isNew = existingItemsSnapshot.empty;
    let totalQuantity = 1;

    // Atualizar moedas e adicionar item
    const batch = firestore.batch();

    // Descontar moedas e rastrear gastos
    const currentCoinsSpent = userData?.coinsSpent || 0;
    batch.update(userRef, {
      coins: userCoins - boxCost,
      coinsSpent: currentCoinsSpent + boxCost, // Rastrear total gasto
      updatedAt: new Date()
    });

    // Adicionar item ao inventário
    if (isNew) {
      const userItemRef = firestore.collection(collections.userItems).doc(userItemId);
      batch.set(userItemRef, userItemData);
    } else {
      // Se já tem, incrementa quantidade e atualiza data de obtenção
      const existingItem = existingItemsSnapshot.docs[0];
      const currentQuantity = existingItem.data().quantity || 1;
      totalQuantity = currentQuantity + 1;
      batch.update(existingItem.ref, {
        quantity: totalQuantity,
        obtainedAt: new Date(), // 🔥 ATUALIZAR DATA SEMPRE QUE GANHA NOVAMENTE
        updatedAt: new Date()
      });
    }

    await batch.commit();

    res.json({
      success: true,
      message: isNew ? '🎉 Novo item obtido!' : '✨ Item duplicado! +1 quantidade',
      data: {
        item: selectedItem,
        rarity: rarityValue,
        userItem: userItemData,
        isNew,
        totalQuantity,
        coinsRemaining: userCoins - boxCost
      }
    });
  } catch (error: any) {
    console.error('Erro ao rolar gacha:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao rolar gacha'
    });
  }
}

// Função para selecionar item aleatório baseado em dropRate
function selectRandomItem(items: any[]): any {
  // Calcular peso total
  const totalWeight = items.reduce((sum, item) => sum + item.dropRate, 0);

  // Gerar número aleatório
  const random = Math.random() * totalWeight;

  // Selecionar item
  let currentWeight = 0;
  for (const item of items) {
    currentWeight += item.dropRate;
    if (random <= currentWeight) {
      return item;
    }
  }

  // Fallback: retornar primeiro item
  return items[0];
}

// Calcular valor de raridade (1-1000)
function calculateRarityValue(rarity: string): number {
  switch (rarity) {
    case 'comum':
      return Math.floor(Math.random() * 200) + 1; // 1-200
    case 'incomum':
      return Math.floor(Math.random() * 200) + 201; // 201-400
    case 'raro':
      return Math.floor(Math.random() * 200) + 401; // 401-600
    case 'epico':
      return Math.floor(Math.random() * 200) + 601; // 601-800
    case 'lendario':
      return Math.floor(Math.random() * 200) + 801; // 801-1000
    default:
      return Math.floor(Math.random() * 1000) + 1;
  }
}

// Listar boxes disponíveis
export async function listBoxes(req: Request, res: Response) {
  try {
    const boxesSnapshot = await firestore.collection('boxes').get();
    const boxes = [];

    for (const doc of boxesSnapshot.docs) {
      const boxData = doc.data();
      
      // Buscar itens da box
      const itemsSnapshot = await firestore
        .collection(collections.items)
        .where('boxId', '==', doc.id)
        .get();
      
      const items = itemsSnapshot.docs.map(itemDoc => itemDoc.data());

      boxes.push({
        ...boxData,
        items
      });
    }

    res.json({
      success: true,
      data: boxes
    });
  } catch (error: any) {
    console.error('Erro ao listar boxes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar boxes'
    });
  }
}

// Buscar box específica
export async function getBox(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const boxDoc = await firestore.collection('boxes').doc(id).get();

    if (!boxDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Box não encontrada'
      });
    }

    const boxData = boxDoc.data();

    // Buscar itens da box
    const itemsSnapshot = await firestore
      .collection(collections.items)
      .where('boxId', '==', id)
      .get();
    
    const items = itemsSnapshot.docs.map(doc => doc.data());

    res.json({
      success: true,
      data: {
        ...boxData,
        items
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar box:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar box'
    });
  }
}
