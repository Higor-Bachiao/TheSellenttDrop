import { Request, Response } from 'express';
import { firestore, collections } from '../config/firebase';

// Listar todos os usuários (apenas admin)
export const listUsers = async (req: Request, res: Response) => {
  try {
    const usersSnapshot = await firestore.collection(collections.users).get();
    const users = usersSnapshot.docs.map((doc: any) => ({
      uid: doc.id,
      ...doc.data()
    }));

    res.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar usuários'
    });
  }
};

// Obter um usuário específico
export const getUser = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const userDoc = await firestore.collection(collections.users).doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        uid: userDoc.id,
        ...userDoc.data()
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar usuário'
    });
  }
};

// Atualizar role do usuário (ADMIN para JOGADOR ou vice-versa)
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'ADMIN' && role !== 'JOGADOR')) {
      return res.status(400).json({
        success: false,
        error: 'Role inválido. Use ADMIN ou JOGADOR'
      });
    }

    await firestore.collection(collections.users).doc(uid).update({
      role,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Role do usuário atualizado para ${role}`
    });
  } catch (error: any) {
    console.error('Erro ao atualizar role:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar role do usuário'
    });
  }
};

// Listar itens de um usuário específico
export const getUserItems = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const requestingUser = (req as any).user; // Usuário autenticado

    // Verificar se o usuário está tentando acessar seus próprios itens
    // ou se é um admin
    const userDoc = await firestore.collection(collections.users).doc(requestingUser.uid).get();
    const userData = userDoc.data();
    
    if (requestingUser.uid !== uid && userData?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Você só pode visualizar seus próprios itens'
      });
    }

    const userItemsSnapshot = await firestore.collection(collections.userItems)
      .where('userId', '==', uid)
      .get();

    const userItems: any[] = [];
    for (const doc of userItemsSnapshot.docs) {
      const userItemData = doc.data();
      
      // Buscar informações completas do item
      const itemDoc = await firestore.collection(collections.items).doc(userItemData.itemId).get();
      
      if (itemDoc.exists) {
        userItems.push({
          id: doc.id,
          quantity: userItemData.quantity,
          rarity: userItemData.rarity,
          obtainedAt: userItemData.obtainedAt,
          item: {
            id: itemDoc.id,
            ...itemDoc.data()
          }
        });
      }
    }

    res.json({
      success: true,
      data: userItems
    });
  } catch (error: any) {
    console.error('Erro ao listar itens do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar itens do usuário'
    });
  }
};
