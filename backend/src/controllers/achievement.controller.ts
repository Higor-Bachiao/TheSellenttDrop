import { Request, Response } from 'express';
import { firestore } from '../config/firebase';
import * as admin from 'firebase-admin';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Definir conquistas disponíveis no sistema
const ACHIEVEMENTS = [
  // Primeira Abertura
  {
    id: 'first_pull',
    name: 'Primeira Abertura',
    description: 'Abra sua primeira caixa',
    type: 'FIRST_PULL',
    requirement: 1,
    reward: 50,
    icon: '🎁',
    tier: 'bronze'
  },
  {
    id: 'pulls_10',
    name: 'Colecionador Iniciante',
    description: 'Abra 10 caixas',
    type: 'PULLS',
    requirement: 10,
    reward: 100,
    icon: '📦',
    tier: 'bronze'
  },
  {
    id: 'pulls_50',
    name: 'Colecionador Experiente',
    description: 'Abra 50 caixas',
    type: 'PULLS',
    requirement: 50,
    reward: 500,
    icon: '📦',
    tier: 'silver'
  },
  {
    id: 'pulls_100',
    name: 'Colecionador Mestre',
    description: 'Abra 100 caixas',
    type: 'PULLS',
    requirement: 100,
    reward: 1000,
    icon: '📦',
    tier: 'gold'
  },
  {
    id: 'pulls_500',
    name: 'Viciado em Gacha',
    description: 'Abra 500 caixas',
    type: 'PULLS',
    requirement: 500,
    reward: 5000,
    icon: '📦',
    tier: 'platinum'
  },
  // Raridades
  {
    id: 'rare_item',
    name: 'Primeira Raridade',
    description: 'Obtenha seu primeiro item raro',
    type: 'RARE_ITEM',
    requirement: 1,
    reward: 75,
    icon: '💎',
    tier: 'bronze'
  },
  {
    id: 'epic_item',
    name: 'Épico!',
    description: 'Obtenha seu primeiro item épico',
    type: 'EPIC_ITEM',
    requirement: 1,
    reward: 150,
    icon: '🔮',
    tier: 'silver'
  },
  {
    id: 'legendary_item',
    name: 'Lendário!',
    description: 'Obtenha seu primeiro item lendário',
    type: 'LEGENDARY_ITEM',
    requirement: 1,
    reward: 300,
    icon: '👑',
    tier: 'gold'
  },
  {
    id: 'quantum_item',
    name: 'Existência Quântica',
    description: 'Obtenha o impossível: um item Quantum',
    type: 'QUANTUM_ITEM',
    requirement: 1,
    reward: 1000,
    icon: '⚛️',
    tier: 'platinum',
    secret: true
  },
  // Coleção
  {
    id: 'collection_10',
    name: 'Pequeno Colecionador',
    description: 'Possua 10 itens únicos diferentes',
    type: 'COLLECTION',
    requirement: 10,
    reward: 200,
    icon: '🎨',
    tier: 'silver'
  },
  {
    id: 'collection_25',
    name: 'Grande Colecionador',
    description: 'Possua 25 itens únicos diferentes',
    type: 'COLLECTION',
    requirement: 25,
    reward: 500,
    icon: '🎨',
    tier: 'gold'
  },
  {
    id: 'all_rarities',
    name: 'Arco-Íris',
    description: 'Possua pelo menos 1 item de cada raridade',
    type: 'ALL_RARITIES',
    requirement: 5,
    reward: 750,
    icon: '🌈',
    tier: 'gold'
  },
  // Gastos
  {
    id: 'spend_1000',
    name: 'Comprador Iniciante',
    description: 'Gaste 1.000 moedas',
    type: 'COINS_SPENT',
    requirement: 1000,
    reward: 100,
    icon: '💰',
    tier: 'bronze'
  },
  {
    id: 'spend_10000',
    name: 'Grande Gastador',
    description: 'Gaste 10.000 moedas',
    type: 'COINS_SPENT',
    requirement: 10000,
    reward: 1000,
    icon: '💰',
    tier: 'silver'
  },
  // Especiais
  {
    id: 'lucky_start',
    name: 'Sorte de Principiante',
    description: 'Obtenha um item lendário nas primeiras 10 aberturas',
    type: 'LUCKY_START',
    requirement: 1,
    reward: 500,
    icon: '🍀',
    tier: 'gold',
    secret: true
  },
  {
    id: 'quantum_start',
    name: 'Anomalia Quântica',
    description: 'Obtenha um item quantum nas primeiras 5 aberturas',
    type: 'QUANTUM_START',
    requirement: 1,
    reward: 2000,
    icon: '✨',
    tier: 'platinum',
    secret: true
  }
];

// Obter todas as conquistas disponíveis
export const getAllAchievements = async (req: Request, res: Response) => {
  try {
    const response: ApiResponse = {
      success: true,
      data: ACHIEVEMENTS
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao obter conquistas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter conquistas'
    });
  }
};

// Obter progresso de conquistas do usuário
export const getUserAchievements = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authenticatedUser = (req as any).user;

    console.log('🔍 getUserAchievements - userId from params:', userId);
    console.log('🔍 getUserAchievements - authenticated user uid:', authenticatedUser.uid);

    // Verificar se o usuário autenticado está acessando suas próprias conquistas ou é admin
    if (authenticatedUser.uid !== userId) {
      const userDoc = await firestore.collection('users').doc(authenticatedUser.uid).get();
      const userData = userDoc.data();
      
      console.log('🔍 User data:', { uid: authenticatedUser.uid, isAdmin: userData?.isAdmin });
      
      if (!userData?.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Acesso negado. Você só pode ver suas próprias conquistas.'
        });
      }
    }

    // Buscar usuário
    const targetUserDoc = await firestore.collection('users').doc(userId).get();
    if (!targetUserDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const userData = targetUserDoc.data();

    // Buscar progresso de conquistas do usuário
    const achievementsSnapshot = await firestore
      .collection('userAchievements')
      .where('userId', '==', userId)
      .get();

    const userAchievements = new Map();
    achievementsSnapshot.forEach((doc: any) => {
      const data = doc.data();
      userAchievements.set(data.achievementId, {
        id: data.achievementId, // Usar o achievementId como ID, não o doc.id
        firestoreId: doc.id,    // Guardar o ID do Firestore separadamente
        progress: data.progress || 0,
        completed: data.completed || false,
        claimed: data.claimed || false,
        completedAt: data.completedAt
      });
    });

    // Combinar conquistas com progresso do usuário
    const achievementsWithProgress = await Promise.all(ACHIEVEMENTS.map(async achievement => {
      let userProgress = userAchievements.get(achievement.id);

      // Se a conquista não existe no banco, criar ela
      if (!userProgress) {
        const newAchievement = {
          userId,
          achievementId: achievement.id,
          progress: 0,
          completed: false,
          claimed: false,
          createdAt: new Date()
        };
        
        const docRef = await firestore.collection('userAchievements').add(newAchievement);
        
        userProgress = {
          id: achievement.id,
          firestoreId: docRef.id,
          progress: 0,
          completed: false,
          claimed: false
        };
      }

      return {
        ...achievement,
        id: achievement.id, // Manter o ID customizado (first_pull, etc)
        progress: userProgress.progress || 0,
        completed: userProgress.completed || false,
        claimed: userProgress.claimed || false,
        completedAt: userProgress.completedAt
      };
    }));

    const response: ApiResponse = {
      success: true,
      data: achievementsWithProgress
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao obter conquistas do usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter conquistas do usuário'
    });
  }
};

// Reivindicar recompensa de conquista
export const claimReward = async (req: Request, res: Response) => {
  try {
    const { userId, achievementId } = req.params;

    // Buscar conquista do usuário
    const achievementSnapshot = await firestore
      .collection('userAchievements')
      .where('userId', '==', userId)
      .where('achievementId', '==', achievementId)
      .limit(1)
      .get();

    if (achievementSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Conquista não encontrada'
      });
    }

    const achievementDoc = achievementSnapshot.docs[0];
    const achievementData = achievementDoc.data();

    // Verificar se já foi completada
    if (!achievementData.completed) {
      return res.status(400).json({
        success: false,
        error: 'Conquista não completada'
      });
    }

    // Verificar se já foi reivindicada
    if (achievementData.claimed) {
      return res.status(400).json({
        success: false,
        error: 'Recompensa já reivindicada'
      });
    }

    // Encontrar a conquista para obter a recompensa
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        error: 'Conquista não encontrada no sistema'
      });
    }

    // Atualizar saldo do usuário usando increment para garantir atomicidade
    const userRef = firestore.collection('users').doc(userId);
    await userRef.update({
      coins: admin.firestore.FieldValue.increment(achievement.reward)
    });

    // Marcar recompensa como reivindicada
    await achievementDoc.ref.update({
      claimed: true,
      claimedAt: new Date()
    });

    console.log(`✅ Usuário ${userId} resgatou ${achievement.reward} moedas da conquista ${achievement.name}`);

    const response: ApiResponse = {
      success: true,
      data: {
        reward: achievement.reward,
        message: 'Recompensa reivindicada com sucesso!'
      }
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao reivindicar recompensa:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao reivindicar recompensa'
    });
  }
};

// Verificar e desbloquear novas conquistas
export const checkAchievements = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Buscar dados do usuário
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const userData = userDoc.data()!;

    // Buscar itens do usuário
    const itemsSnapshot = await firestore
      .collection('userItems')
      .where('userId', '==', userId)
      .get();

    const userItems = itemsSnapshot.docs.map((doc: any) => doc.data());

    // Calcular estatísticas
    const stats = {
      totalPulls: userItems.length,
      coinsSpent: userData.coinsSpent || 0,
      uniqueItems: new Set(userItems.map((item: any) => item.itemId)).size,
      rarities: {
        comum: userItems.filter((item: any) => item.rarity === 'comum').length,
        raro: userItems.filter((item: any) => item.rarity === 'raro').length,
        epico: userItems.filter((item: any) => item.rarity === 'epico').length,
        lendario: userItems.filter((item: any) => item.rarity === 'lendario').length,
        quantum: userItems.filter((item: any) => item.rarity === 'quantum').length
      }
    };

    // Buscar conquistas atuais do usuário
    const achievementsSnapshot = await firestore
      .collection('userAchievements')
      .where('userId', '==', userId)
      .get();

    const userAchievements = new Map();
    achievementsSnapshot.forEach((doc: any) => {
      userAchievements.set(doc.data().achievementId, doc);
    });

    const newAchievements: any[] = [];

    // Verificar cada conquista
    for (const achievement of ACHIEVEMENTS) {
      let progress = 0;
      let completed = false;

      // Calcular progresso baseado no tipo
      switch (achievement.type) {
        case 'FIRST_PULL':
        case 'PULLS':
          progress = stats.totalPulls;
          break;
        case 'RARE_ITEM':
          progress = stats.rarities.raro > 0 ? 1 : 0;
          break;
        case 'EPIC_ITEM':
          progress = stats.rarities.epico > 0 ? 1 : 0;
          break;
        case 'LEGENDARY_ITEM':
          progress = stats.rarities.lendario > 0 ? 1 : 0;
          break;
        case 'QUANTUM_ITEM':
          progress = stats.rarities.quantum > 0 ? 1 : 0;
          break;
        case 'COLLECTION':
          progress = stats.uniqueItems;
          break;
        case 'ALL_RARITIES':
          progress = Object.values(stats.rarities).filter(count => count > 0).length;
          break;
        case 'COINS_SPENT':
          progress = stats.coinsSpent;
          break;
        case 'LUCKY_START':
          if (stats.totalPulls <= 10 && stats.rarities.lendario > 0) {
            progress = 1;
          }
          break;
        case 'QUANTUM_START':
          if (stats.totalPulls <= 5 && stats.rarities.quantum > 0) {
            progress = 1;
          }
          break;
      }

      completed = progress >= achievement.requirement;

      // Criar ou atualizar conquista do usuário
      const existingAchievement = userAchievements.get(achievement.id);

      if (!existingAchievement) {
        // Criar nova conquista
        const newAchievement: any = {
          userId,
          achievementId: achievement.id,
          progress,
          completed,
          claimed: false,
          createdAt: new Date()
        };

        if (completed) {
          newAchievement.completedAt = new Date();
          newAchievements.push(achievement);
        }

        await firestore.collection('userAchievements').add(newAchievement);
      } else {
        // Atualizar conquista existente
        const existingData = existingAchievement.data();
        if (!existingData.completed && completed) {
          await existingAchievement.ref.update({
            progress,
            completed: true,
            completedAt: new Date()
          });
          newAchievements.push(achievement);
        } else if (existingData.progress !== progress) {
          await existingAchievement.ref.update({ progress });
        }
      }
    }

    const response: ApiResponse = {
      success: true,
      data: newAchievements
    };
    res.json(response);
  } catch (error) {
    console.error('Erro ao verificar conquistas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar conquistas'
    });
  }
};
