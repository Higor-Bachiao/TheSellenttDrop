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

    // 🔥 OTIMIZAÇÃO: Buscar todos os userItems primeiro
    const userItemsSnapshot = await firestore.collection(collections.userItems)
      .where('userId', '==', uid)
      .get();

    if (userItemsSnapshot.empty) {
      return res.json({
        success: true,
        data: []
      });
    }

    // 🔥 OTIMIZAÇÃO: Coletar todos os itemIds únicos
    const itemIds = [...new Set(userItemsSnapshot.docs.map(doc => doc.data().itemId))];

    // 🔥 OTIMIZAÇÃO: Buscar todos os itens de uma vez com "in" query
    const itemsSnapshot = await firestore.collection(collections.items)
      .where('__name__', 'in', itemIds.slice(0, 10)) // Firestore limita a 10 items por "in" query
      .get();

    // 🔥 OTIMIZAÇÃO: Criar mapa de itens para acesso O(1)
    const itemsMap = new Map();
    itemsSnapshot.docs.forEach(doc => {
      itemsMap.set(doc.id, {
        id: doc.id,
        ...doc.data()
      });
    });

    // 🔥 OTIMIZAÇÃO: Se houver mais de 10 itens, buscar em lotes
    if (itemIds.length > 10) {
      for (let i = 10; i < itemIds.length; i += 10) {
        const batchIds = itemIds.slice(i, i + 10);
        const batchSnapshot = await firestore.collection(collections.items)
          .where('__name__', 'in', batchIds)
          .get();

        batchSnapshot.docs.forEach(doc => {
          itemsMap.set(doc.id, {
            id: doc.id,
            ...doc.data()
          });
        });
      }
    }

    // 🔥 OTIMIZAÇÃO: Construir resposta final usando o mapa
    const userItems: any[] = [];
    userItemsSnapshot.docs.forEach(doc => {
      const userItemData = doc.data();
      const item = itemsMap.get(userItemData.itemId);

      if (item) {
        // 🔥 CORREÇÃO: Garantir que obtainedAt seja um timestamp numérico
        let obtainedAt = userItemData.obtainedAt;

        // Debug: mostrar formato original
        console.log('📅 Formato original obtainedAt:', obtainedAt, typeof obtainedAt);

        if (obtainedAt && typeof obtainedAt.toDate === 'function') {
          // Firestore Timestamp - converter para timestamp numérico
          obtainedAt = obtainedAt.toDate().getTime();
          console.log('📅 Convertido toDate():', new Date(obtainedAt));
        } else if (obtainedAt instanceof Date) {
          // Já é Date - converter para timestamp
          obtainedAt = obtainedAt.getTime();
          console.log('📅 Já era Date:', new Date(obtainedAt));
        } else if (typeof obtainedAt === 'object' && obtainedAt && typeof obtainedAt._seconds === 'number') {
          // Formato serializado - converter
          obtainedAt = obtainedAt._seconds * 1000;
          console.log('📅 Convertido _seconds:', new Date(obtainedAt));
        } else if (typeof obtainedAt === 'number') {
          // Já é timestamp numérico
          console.log('📅 Já era timestamp:', new Date(obtainedAt));
        } else {
          // Fallback
          obtainedAt = Date.now();
          console.log('📅 Fallback para agora:', new Date(obtainedAt));
        }

        userItems.push({
          id: doc.id,
          quantity: userItemData.quantity,
          rarity: userItemData.rarity,
          obtainedAt: obtainedAt,
          item: item
        });
      }
    });

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
