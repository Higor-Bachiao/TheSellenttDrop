import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser, onAuthStateChanged, updateProfile, sendEmailVerification } from '@angular/fire/auth';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, ApiResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);
  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor() {
    this.initAuthStateListener();
  }

  private initAuthStateListener(): void {
    onAuthStateChanged(this.auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        this.tokenSubject.next(token);
        this.loadCurrentUser().subscribe();
      } else {
        this.currentUserSubject.next(null);
        this.tokenSubject.next(null);
      }
    });
  }

  register(email: string, password: string, displayName: string): Observable<User> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (userCredential) => {
        try {
          // Atualizar perfil com displayName
          await updateProfile(userCredential.user, { displayName });
          
          // Enviar email de verificação
          await sendEmailVerification(userCredential.user, {
            url: 'http://localhost:4200/auth/login?verified=true',
            handleCodeInApp: false
          });
          
          const token = await userCredential.user.getIdToken();
          return { token, uid: userCredential.user.uid };
        } catch (error) {
          console.error('Erro ao enviar email de verificação:', error);
          const token = await userCredential.user.getIdToken();
          return { token, uid: userCredential.user.uid };
        }
      }),
      switchMap(({ token }) => {
        return this.http.post<ApiResponse<User>>(
          `${environment.apiUrl}/auth/register`,
          { email, password, displayName },
          { headers: { Authorization: `Bearer ${token}` } }
        ).pipe(
          catchError((httpError) => {
            // Se der erro no backend mas o usuário foi criado no Firebase, continua
            console.warn('Erro ao registrar no backend, mas usuário criado no Firebase:', httpError);
            // Retorna dados básicos do usuário
            return throwError(() => httpError);
          })
        );
      }),
      map(response => {
        if (response.success && response.data) {
          // Não loga automaticamente, usuário precisa verificar email
          return response.data;
        }
        throw new Error(response.error || 'Erro ao registrar usuário');
      }),
      catchError(error => {
        console.error('Erro no registro:', error);
        
        // Se for email já em uso, mostra mensagem específica
        if (error?.code === 'auth/email-already-in-use') {
          return throwError(() => ({
            code: 'auth/email-already-in-use',
            message: 'Este e-mail já está em uso'
          }));
        }
        
        return throwError(() => error);
      })
    );
  }

  login(email: string, password: string): Observable<User> {
    console.log('🔵 AuthService.login() called with email:', email);
    
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap(async (userCredential) => {
        console.log('✅ Firebase signIn SUCCESS:', userCredential.user.uid);
        
        // Verificar se o email foi verificado
        // ⚠️ TEMPORARIAMENTE DESABILITADO PARA TESTES
        // if (!userCredential.user.emailVerified) {
        //   throw {
        //     code: 'auth/email-not-verified',
        //     message: 'Por favor, verifique seu email antes de fazer login. Verifique sua caixa de entrada e spam.'
        //   };
        // }
        
        const token = await userCredential.user.getIdToken();
        console.log('✅ Got Firebase token');
        this.tokenSubject.next(token);
        return { token, uid: userCredential.user.uid };
      }),
      switchMap(({ uid }) => {
        console.log('🔵 Fetching user data from backend:', `${environment.apiUrl}/auth/user/${uid}`);
        // Buscar dados do usuário no backend
        return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/user/${uid}`);
      }),
      map(response => {
        console.log('✅ Backend response:', response);
        if (response.success && response.data) {
          this.currentUserSubject.next(response.data);
          return response.data;
        }
        throw new Error(response.error || 'Erro ao fazer login');
      }),
      catchError(error => {
        console.error('❌ Erro no login:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        this.tokenSubject.next(null);
      })
    );
  }

  loadCurrentUser(): Observable<User> {
    const token = this.tokenSubject.value;
    
    if (!token) {
      return throwError(() => new Error('Não autenticado'));
    }

    return this.http.get<ApiResponse<User>>(`${environment.apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          this.currentUserSubject.next(response.data);
          return response.data;
        }
        throw new Error(response.error || 'Erro ao carregar usuário');
      }),
      catchError(error => {
        console.error('Erro ao carregar usuário:', error);
        this.currentUserSubject.next(null);
        return throwError(() => error);
      })
    );
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'ADMIN';
  }
}
