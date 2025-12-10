import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'users',
        pathMatch: 'full'
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/user-management/user-management.component').then(m => m.UserManagementComponent)
      },
      {
        path: 'items',
        loadComponent: () => import('./pages/item-management/item-management.component').then(m => m.ItemManagementComponent)
      }
    ]
  }
];
