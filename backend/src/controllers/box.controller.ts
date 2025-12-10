import { Request, Response } from 'express';
import { firestore, collections } from '../config/firebase';

// Listar todas as boxes
export const listBoxes = async (req: Request, res: Response) => {
  try {
    const boxesSnapshot = await firestore.collection('boxes').get();
    const boxes = boxesSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

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
};

// Obter uma box específica
export const getBox = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const boxDoc = await firestore.collection('boxes').doc(id).get();

    if (!boxDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Box não encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        id: boxDoc.id,
        ...boxDoc.data()
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar box:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar box'
    });
  }
};

// Criar nova box
export const createBox = async (req: Request, res: Response) => {
  try {
    const { name, description, imageUrl, cost } = req.body;
    console.log('📦 Criando nova box:', { name, cost });

    if (!name || !cost) {
      return res.status(400).json({
        success: false,
        error: 'Nome e custo são obrigatórios'
      });
    }

    // Criar referência com ID automático
    const boxRef = firestore.collection('boxes').doc();
    const boxId = boxRef.id;

    const boxData = {
      id: boxId, // Salvar o ID dentro do documento
      name,
      description: description || '',
      imageUrl: imageUrl || 'https://via.placeholder.com/400x300/f97316/FFFFFF?text=Box',
      cost: Number(cost),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Salvando box com ID:', boxId);
    await boxRef.set(boxData);
    console.log('✅ Box criada com sucesso!');

    res.status(201).json({
      success: true,
      message: 'Box criada com sucesso!',
      data: boxData
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar box:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar box'
    });
  }
};

// Atualizar box
export const updateBox = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, cost } = req.body;
    console.log('✏️ Atualizando box:', id);

    const boxRef = firestore.collection('boxes').doc(id);
    const boxDoc = await boxRef.get();

    if (!boxDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Box não encontrada'
      });
    }

    const updateData: any = {
      id, // Garantir que o ID está no documento
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (cost !== undefined) updateData.cost = Number(cost);

    await boxRef.update(updateData);
    console.log('✅ Box atualizada com sucesso!');

    res.json({
      success: true,
      message: 'Box atualizada com sucesso!',
      data: {
        id,
        ...boxDoc.data(),
        ...updateData
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao atualizar box:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar box'
    });
  }
};

// Deletar box
export const deleteBox = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const boxRef = firestore.collection('boxes').doc(id);
    const boxDoc = await boxRef.get();

    if (!boxDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Box não encontrada'
      });
    }

    // Deletar todos os itens associados a esta box
    const itemsSnapshot = await firestore.collection(collections.items)
      .where('boxId', '==', id)
      .get();

    const batch = firestore.batch();
    itemsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    batch.delete(boxRef);
    await batch.commit();

    res.json({
      success: true,
      message: 'Box e seus itens deletados com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao deletar box:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar box'
    });
  }
};
