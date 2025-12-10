import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { User } from '../../../../shared/types';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  currentUser$: Observable<User | null>;

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
