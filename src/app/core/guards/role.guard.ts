import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }

    const currentRole = authService.role();
    const expectedRoles: string[] = route.data['expectedRoles']
        || (route.data['expectedRole'] ? [route.data['expectedRole']] : []);

    if (expectedRoles.length === 0 || expectedRoles.includes(currentRole)) {
        return true;
    }

    // Authenticated but unauthorized for this role -> redirect to /home
    return router.createUrlTree(['/home']);
};
