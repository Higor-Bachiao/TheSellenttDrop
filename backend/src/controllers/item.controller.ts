import { Request, Response } from 'express';
import { firestore, collections } from '../config/firebase';

enum ItemRarity {
  COMUM = 'comum',
  INCOMUM = 'incomum',
  RARO = 'raro',
  EPICO = 'epico',
  LENDARIO = 'lendario'
}

// Criar primeira box com 6 itens de exemplo
export async function initializeDefaultBox(req: Request, res: Response) {
  try {
    const boxId = 'box-inicial';
    
    // Verificar se já existe
    const existingBox = await firestore.collection('boxes').doc(boxId).get();
    if (existingBox.exists) {
      return res.status(400).json({
        success: false,
        error: 'Box inicial já existe'
      });
    }

    // Criar 6 itens de exemplo
    const defaultItems = [
      {
        id: 'item-1',
        name: 'Item Comum 1',
        description: 'Um item comum para começar',
        rarity: ItemRarity.COMUM,
        imageUrl: 'https://via.placeholder.com/300x300/9e9e9e/FFFFFF?text=Comum+1',
        dropRate: 40, // 40% de chance
        boxId: boxId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'item-2',
        name: 'Item Comum 2',
        description: 'Outro item comum',
        rarity: ItemRarity.COMUM,
        imageUrl: 'https://via.placeholder.com/300x300/9e9e9e/FFFFFF?text=Comum+2',
        dropRate: 30, // 30% de chance
        boxId: boxId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'item-3',
        name: 'Item Incomum',
        description: 'Um item incomum',
        rarity: ItemRarity.INCOMUM,
        imageUrl: 'https://via.placeholder.com/300x300/4caf50/FFFFFF?text=Incomum',
        dropRate: 15, // 15% de chance
        boxId: boxId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'item-4',
        name: 'Item Raro',
        description: 'Um item raro',
        rarity: ItemRarity.RARO,
        imageUrl: 'https://via.placeholder.com/300x300/2196f3/FFFFFF?text=Raro',
        dropRate: 10, // 10% de chance
        boxId: boxId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'item-5',
        name: 'Item Épico',
        description: 'Um item épico',
        rarity: ItemRarity.EPICO,
        imageUrl: 'https://via.placeholder.com/300x300/9c27b0/FFFFFF?text=Epico',
        dropRate: 4, // 4% de chance
        boxId: boxId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'item-6',
        name: 'Item Lendário',
        description: 'Um item lendário muito raro!',
        rarity: ItemRarity.LENDARIO,
        imageUrl: 'https://via.placeholder.com/300x300/f44336/FFFFFF?text=Lendario',
        dropRate: 1, // 1% de chance
        boxId: boxId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Salvar itens
    const batch = firestore.batch();
    for (const item of defaultItems) {
      const itemRef = firestore.collection(collections.items).doc(item.id);
      batch.set(itemRef, item);
    }

    // Criar a box
    const boxRef = firestore.collection('boxes').doc(boxId);
    batch.set(boxRef, {
      id: boxId,
      name: 'Box Inicial',
      description: 'A primeira caixa do gacha! Contém 6 itens com diferentes raridades.',
      imageUrl: 'https://via.placeholder.com/400x300/f97316/FFFFFF?text=Box+Inicial',
      cost: 100, // Custo: 100 moedas
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await batch.commit();

    res.status(201).json({
      success: true,
      message: 'Box inicial criada com sucesso!',
      data: {
        box: { id: boxId, name: 'Box Inicial', cost: 100 },
        items: defaultItems
      }
    });
  } catch (error: any) {
    console.error('Erro ao criar box inicial:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar box inicial'
    });
  }
}

// Listar todos os itens
export async function listItems(req: Request, res: Response) {
  try {
    const { boxId } = req.query;
    console.log('📋 Listando itens. BoxId filter:', boxId);
    
    let query = firestore.collection(collections.items);
    
    if (boxId) {
      query = query.where('boxId', '==', boxId) as any;
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map(doc => doc.data());
    console.log(`✅ ${items.length} item(ns) encontrado(s)`);
    console.log('Items:', items.map(i => ({ id: i.id, name: i.name, boxId: i.boxId })));

    res.json({
      success: true,
      data: items
    });
  } catch (error: any) {
    console.error('❌ Erro ao listar itens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar itens'
    });
  }
}

// Buscar item por ID
export async function getItem(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const itemDoc = await firestore.collection(collections.items).doc(id).get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Item não encontrado'
      });
    }

    res.json({
      success: true,
      data: itemDoc.data()
    });
  } catch (error: any) {
    console.error('Erro ao buscar item:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar item'
    });
  }
}

// Criar novo item
export async function createItem(req: Request, res: Response) {
  try {
    const { name, description, rarity, imageUrl, dropRate, boxId } = req.body;
    console.log('📦 Recebendo requisição para criar item:', req.body);

    if (!name || !rarity || dropRate === undefined) {
      console.log('❌ Validação falhou - campos obrigatórios faltando');
      return res.status(400).json({
        success: false,
        error: 'Nome, raridade e dropRate são obrigatórios'
      });
    }

    const itemId = `item-${Date.now()}`;
    const itemData = {
      id: itemId,
      name,
      description: description || '',
      rarity,
      imageUrl: imageUrl || '/assets/items/placeholder.png',
      dropRate: Number(dropRate),
      boxId: boxId || 'box-inicial',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Salvando item no Firestore:', itemData);
    await firestore.collection(collections.items).doc(itemId).set(itemData);
    console.log('✅ Item salvo com sucesso!');

    res.status(201).json({
      success: true,
      message: 'Item criado com sucesso!',
      data: itemData
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar item:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar item'
    });
  }
}

// Atualizar item
export async function updateItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const itemRef = firestore.collection(collections.items).doc(id);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Item não encontrado'
      });
    }

    const updatedData = {
      ...updates,
      updatedAt: new Date()
    };

    await itemRef.update(updatedData);

    res.json({
      success: true,
      message: 'Item atualizado com sucesso!',
      data: { id, ...updatedData }
    });
  } catch (error: any) {
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar item'
    });
  }
}

// Deletar item
export async function deleteItem(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const itemRef = firestore.collection(collections.items).doc(id);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Item não encontrado'
      });
    }

    await itemRef.delete();

    res.json({
      success: true,
      message: 'Item deletado com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao deletar item:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar item'
    });
  }
}

// Migrar itens sem boxId para box-inicial
export async function migrateItemsToBox(req: Request, res: Response) {
  try {
    const { targetBoxId = 'box-inicial', secretKey } = req.body;

    // Verificar chave secreta
    if (secretKey !== 'admin-secret-2024') {
      return res.status(403).json({
        success: false,
        error: 'Chave secreta inválida'
      });
    }

    // Buscar itens sem boxId ou com boxId vazio
    const itemsSnapshot = await firestore.collection(collections.items).get();
    
    const batch = firestore.batch();
    let migratedCount = 0;

    for (const doc of itemsSnapshot.docs) {
      const data = doc.data();
      if (!data.boxId || data.boxId === '') {
        batch.update(doc.ref, { boxId: targetBoxId });
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      await batch.commit();
    }

    res.json({
      success: true,
      message: `${migratedCount} item(ns) migrado(s) com sucesso!`,
      data: {
        migratedCount,
        targetBoxId
      }
    });
  } catch (error: any) {
    console.error('Erro ao migrar itens:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao migrar itens'
    });
  }
}
