import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },

  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./components/layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'simulator',
        loadComponent: () => import('./components/simulation/simulation.component').then(m => m.SimulationComponent)
      },
      {
        path: 'request',
        loadComponent: () => import('./components/credit-request/credit-request.component').then(m => m.CreditRequestComponent)
      },
      {
        path: 'my-credits',
        loadComponent: () => import('./components/my-credits/my-credits.component').then(m => m.MyCreditsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./components/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
      },
      // Admin routes
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'dashboard',
            loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
          },
          {
            path: 'requests',
            loadComponent: () => import('./components/admin/admin-requests/admin-requests.component').then(m => m.AdminRequestsComponent)
          },
          {
            path: 'users',
            loadComponent: () => import('./components/admin/admin-users/admin-users.component').then(m => m.AdminUsersComponent)
          },
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          }
        ]
      },
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
