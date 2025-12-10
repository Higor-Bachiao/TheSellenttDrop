import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { User } from '../models';
import { map } from 'rxjs/operators';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map((user: User | null) => {
      if (user && user.role === 'ADMIN') {
        return true;
      }
      router.navigate(['/']);
      return false;
    })
  );
};
