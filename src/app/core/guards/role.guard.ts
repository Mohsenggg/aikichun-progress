import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const expectedRole = route.data['expectedRole'];

    if (authService.isLoggedIn() && authService.role() === expectedRole) {
        return true;
    }

    // Redirect to home if authorized but wrong role, or login if not auth
    if (authService.isLoggedIn()) {
        return router.createUrlTree(['/']);
    }

    return router.createUrlTree(['/login']);
};
