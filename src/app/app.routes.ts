import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    {
        path: 'login',
        loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'admin',
        canActivate: [roleGuard],
        data: { expectedRole: 'admin' },
        loadChildren: () => import('./features/admin-profiles/admin-profiles.routes').then(m => m.ADMIN_ROUTES)
    },
    {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
    },
    {
        path: 'roadmap',
        canActivate: [authGuard],
        loadComponent: () => import('./features/roadmap/roadmap.component').then(m => m.RoadmapComponent)
    },
    { path: '**', redirectTo: '/login' }
];
