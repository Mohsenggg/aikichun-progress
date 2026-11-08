import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Public Auth Routes (Preserved)
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },

  // Authenticated Home (Landing page for all active roles)
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
  },

  // Coach Roadmap Builder (Admin only)
  {
    path: 'coach/roadmap',
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: ['admin'] },
    loadComponent: () =>
      import('./features/roadmap/coach/roadmap-builder/roadmap-builder.component')
        .then(m => m.RoadmapBuilderComponent)
  },

  // Trainee Player Pages (Trainee & Admin)
  {
    path: 'trainee',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/roadmap/trainee/pages/trainee-home/trainee-home.component')
            .then(m => m.TraineeHomeComponent)
      },
      {
        path: 'level/:levelId',
        loadComponent: () =>
          import('./features/roadmap/trainee/pages/level-detail/level-detail.component')
            .then(m => m.LevelDetailComponent)
      }
    ]
  },

  // User & Subscription Management (Admin & Moderator)
  {
    path: 'admin/users',
    canActivate: [authGuard, roleGuard],
    data: { expectedRoles: ['admin', 'moderator'] },
    loadComponent: () =>
      import('./features/admin-users/user-list/user-list.component')
        .then(m => m.UserListComponent)
  },

  // User Profile
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
  },

  // Fallback Wildcard
  { path: '**', redirectTo: '/login' }
];
