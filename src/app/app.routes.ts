import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/coach/roadmap', pathMatch: 'full' },
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
        path: 'roadmap',
        canActivate: [authGuard],
        loadComponent: () => import('./features/roadmap_old/roadmap.component').then(m => m.RoadmapComponent)
    },
    {
        path: 'coach/roadmap',
        // canActivate: [roleGuard],
        // data: { expectedRole: 'admin' },
        loadComponent: () =>
            import('./features/roadmap/coach/roadmap-builder/roadmap-builder.component')
                .then(m => m.RoadmapBuilderComponent)
    },
    { path: '**', redirectTo: '/login' }
];
