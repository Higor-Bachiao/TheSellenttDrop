import { Router } from 'express';
import * as achievementController from '../controllers/achievement.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas de conquistas requerem autenticação
router.use(authMiddleware);

// Obter progresso de conquistas do usuário
router.get('/users/:userId/achievements', achievementController.getUserAchievements);

// Reivindicar recompensa de conquista
router.post('/users/:userId/achievements/:achievementId/claim', achievementController.claimReward);

// Verificar novas conquistas desbloqueadas
router.post('/users/:userId/achievements/check', achievementController.checkAchievements);

// Obter todas as conquistas disponíveis (admin)
router.get('/achievements', achievementController.getAllAchievements);

export default router;
