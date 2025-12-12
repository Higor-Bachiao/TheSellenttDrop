import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
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
    path: '',
    loadComponent: () => import('./shared/components/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'gacha',
        pathMatch: 'full'
      },
      {
        path: 'gacha',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/gacha/pages/gacha-main/gacha-main.component').then(m => m.GachaMainComponent)
          },
          {
            path: 'roll',
            loadComponent: () => import('./features/gacha/pages/gacha-roll/gacha-roll.component').then(m => m.GachaRollComponent)
          }
        ]
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/pages/inventory-main/inventory-main.component').then(m => m.InventoryMainComponent)
      },
      {
        path: 'achievements',
        loadComponent: () => import('./features/achievements/pages/achievements-main/achievements-main.component').then(m => m.AchievementsMainComponent)
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
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
            path: 'boxes',
            loadComponent: () => import('./features/admin/pages/box-management/box-management.component').then(m => m.BoxManagementComponent)
          },
          {
            path: 'items',
            loadComponent: () => import('./features/admin/pages/item-management/item-management.component').then(m => m.ItemManagementComponent)
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/gacha'
  }
];
