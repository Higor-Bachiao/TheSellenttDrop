import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);

  // Se não for uma requisição para a API, prosseguir sem token
  if (!req.url.includes('/api/')) {
    return next(req);
  }

  // Pegar o token do usuário autenticado
  return from(
    auth.currentUser?.getIdToken() || Promise.resolve(null)
  ).pipe(
    switchMap((token) => {
      // Se houver token, adicionar ao header
      if (token) {
        const clonedReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(clonedReq);
      }
      // Se não houver token, prosseguir sem modificar
      return next(req);
    })
  );
};
