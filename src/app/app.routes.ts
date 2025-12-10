import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/gacha',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'gacha',
    loadComponent: () => import('./features/gacha/pages/gacha-main/gacha-main.component').then(m => m.GachaMainComponent),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    loadComponent: () => import('./features/inventory/pages/inventory-main/inventory-main.component').then(m => m.InventoryMainComponent),
    canActivate: [authGuard]
  },
  {
    path: 'achievements',
    loadComponent: () => import('./features/achievements/pages/achievements-main/achievements-main.component').then(m => m.AchievementsMainComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/pages/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'items',
        loadComponent: () => import('./features/admin/pages/item-management/item-management.component').then(m => m.ItemManagementComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/gacha'
  }
];
