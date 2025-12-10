import { Request, Response, NextFunction } from 'express';
import { firestore, collections } from '../config/firebase';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = (req as any).user;
    
    if (!user || !user.uid) {
      return res.status(401).json({
        success: false,
        error: 'Não autenticado'
      });
    }

    // Buscar dados do usuário no Firestore
    const userDoc = await firestore.collection(collections.users).doc(user.uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const userData = userDoc.data();
    
    if (userData?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem acessar esta rota.'
      });
    }

    next();
  } catch (error: any) {
    console.error('Erro no middleware de admin:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar permissões'
    });
  }
}
