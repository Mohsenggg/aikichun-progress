import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppLayoutComponent } from './core/components/app-layout/app-layout.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Public Auth Routes (No header / shell)
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

  // Authenticated Application Shell (With NavHeader and Global Profile)
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'coach/roadmap',
        canActivate: [roleGuard],
        data: { expectedRoles: ['admin'] },
        loadComponent: () =>
          import('./features/roadmap/coach/roadmap-builder/roadmap-builder.component')
            .then(m => m.RoadmapBuilderComponent)
      },
      {
        path: 'trainee',
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
      {
        path: 'admin/users',
        canActivate: [roleGuard],
        data: { expectedRoles: ['admin', 'moderator'] },
        loadComponent: () =>
          import('./features/admin-users/user-list/user-list.component')
            .then(m => m.UserListComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },

  // Fallback Wildcard
  { path: '**', redirectTo: '/login' }
];
