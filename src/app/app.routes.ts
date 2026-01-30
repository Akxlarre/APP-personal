import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { publicGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'login/register',
    canActivate: [publicGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'hoy', pathMatch: 'full' },
      {
        path: 'hoy',
        loadComponent: () => import('./features/dashboard/hoy/hoy.component').then(m => m.HoyComponent),
      },
      {
        path: 'templates',
        loadComponent: () => import('./features/templates/templates-list/templates-list.component').then(m => m.TemplatesListComponent),
      },
      {
        path: 'shared',
        loadComponent: () => import('./features/shared-blocks/shared-blocks-list/shared-blocks-list.component').then(m => m.SharedBlocksListComponent),
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent),
      },
      {
        path: 'turnos',
        loadComponent: () => import('./features/dashboard/turnos/turnos.component').then(m => m.TurnosComponent),
      },
    ],
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
