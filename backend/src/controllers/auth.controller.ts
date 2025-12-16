import { Request, Response } from 'express';
import { auth, firestore, collections } from '../config/firebase';

// Enum local (mesmo do shared/types.ts)
enum UserRole {
  JOGADOR = 'JOGADOR',
  ADMIN = 'ADMIN'
}

export async function register(req: Request, res: Response) {
  try {
    const { email, password, displayName } = req.body;

    // Validação básica
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password e displayName são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'A senha deve ter no mínimo 6 caracteres'
      });
    }

    // Verificar se o usuário já existe
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      
      // Se chegou aqui, o usuário já existe
      // Verificar se já tem documento no Firestore
      const existingUserDoc = await firestore.collection(collections.users).doc(userRecord.uid).get();
      
      if (existingUserDoc.exists) {
        return res.status(400).json({
          success: false,
          error: 'Este e-mail já está em uso'
        });
      }
      
      // Se não tem documento, cria (caso de usuário criado apenas no Auth)
      // Não faz nada, vai usar este userRecord
    } catch (getUserError: any) {
      // Usuário não existe, pode criar
      if (getUserError.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          displayName,
          emailVerified: false
        });
      } else {
        throw getUserError;
      }
    }

    // Gerar link de verificação de email
    const actionCodeSettings = {
      url: 'http://localhost:4200/auth/login?verified=true',
      handleCodeInApp: false
    };

    try {
      const verificationLink = await auth.generateEmailVerificationLink(email, actionCodeSettings);
      console.log('📧 Link de verificação:', verificationLink);
      console.log('⚠️  Em produção, envie este link por email para:', email);
    } catch (linkError) {
      console.error('Erro ao gerar link de verificação:', linkError);
    }

    // Criar documento do usuário no Firestore
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: displayName,
      role: UserRole.JOGADOR,
      coins: 1500, // Moedas iniciais de boas-vindas
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await firestore.collection(collections.users).doc(userRecord.uid).set(userData);

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso! Verifique seu email antes de fazer login.',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: displayName,
        emailVerified: false
      }
    });
  } catch (error: any) {
    console.error('Erro ao registrar usuário:', error);
    
    // Tratamento de erros específicos do Firebase
    let errorMessage = 'Erro ao criar conta';
    
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'Este e-mail já está em uso';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'E-mail inválido';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Senha muito fraca';
    }

    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
}

export async function getUserData(req: Request, res: Response) {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({
        success: false,
        error: 'UID é obrigatório'
      });
    }

    // Buscar dados do usuário no Firestore
    const userDoc = await firestore.collection(collections.users).doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const userData = userDoc.data();
    
    res.json({
      success: true,
      data: {
        ...userData,
        isAdmin: userData?.role === 'ADMIN'
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar dados do usuário'
    });
  }
}

export async function verifyToken(req: Request, res: Response) {
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

    // Buscar dados do usuário
    const userDoc = await firestore.collection(collections.users).doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: userDoc.data()
    });
  } catch (error: any) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
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

    // Buscar dados do usuário no Firestore
    const userDoc = await firestore.collection(collections.users).doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const userData = userDoc.data();

    res.json({
      success: true,
      data: {
        ...userData,
        isAdmin: userData?.role === 'ADMIN'
      }
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuário atual:', error);
    res.status(401).json({
      success: false,
      error: 'Token inválido ou expirado'
    });
  }
}

// Rota especial para promover usuário a admin (apenas para desenvolvimento)
export async function promoteToAdmin(req: Request, res: Response) {
  try {
    const { email, secretKey } = req.body;

    // Chave secreta para proteger esta rota (em produção, use variável de ambiente)
    if (secretKey !== 'admin-secret-2024') {
      return res.status(403).json({
        success: false,
        error: 'Chave secreta inválida'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    // Buscar usuário por email
    const userRecord = await auth.getUserByEmail(email);

    // Atualizar role no Firestore
    await firestore.collection(collections.users).doc(userRecord.uid).update({
      role: UserRole.ADMIN,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Usuário ${email} promovido a ADMIN com sucesso!`,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: 'ADMIN'
      }
    });
  } catch (error: any) {
    console.error('Erro ao promover usuário:', error);
    
    let errorMessage = 'Erro ao promover usuário';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado';
    }

    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
}

// Verificar email manualmente (apenas desenvolvimento)
export async function verifyEmail(req: Request, res: Response) {
  try {
    const { email, secretKey } = req.body;

    if (secretKey !== 'admin-secret-2024') {
      return res.status(403).json({
        success: false,
        error: 'Chave secreta inválida'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    // Buscar usuário por email
    const userRecord = await auth.getUserByEmail(email);

    // Atualizar emailVerified no Firebase Auth
    await auth.updateUser(userRecord.uid, {
      emailVerified: true
    });

    // Atualizar no Firestore
    await firestore.collection(collections.users).doc(userRecord.uid).update({
      emailVerified: true,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: `Email ${email} verificado com sucesso!`,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        emailVerified: true
      }
    });
  } catch (error: any) {
    console.error('Erro ao verificar email:', error);
    
    let errorMessage = 'Erro ao verificar email';
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'Usuário não encontrado';
    }

    res.status(400).json({
      success: false,
      error: errorMessage
    });
  }
}
