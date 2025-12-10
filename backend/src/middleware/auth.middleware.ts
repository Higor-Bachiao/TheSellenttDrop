import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token não fornecido'
      });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      const decodedToken = await auth.verifyIdToken(token);
      (req as any).user = decodedToken;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
    }
  } catch (error: any) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao verificar autenticação'
    });
  }
}
