import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { roleGuard } from './role.guard';
import { AuthService, UserRole } from '../auth/auth.service';
import { signal } from '@angular/core';

describe('roleGuard', () => {
  let router: Router;
  let mockAuthService: {
    isLoggedIn: jasmine.Spy;
    role: jasmine.Spy;
  };

  beforeEach(() => {
    mockAuthService = {
      isLoggedIn: jasmine.createSpy('isLoggedIn'),
      role: jasmine.createSpy('role')
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    router = TestBed.inject(Router);
  });

  function executeGuard(routeData: Record<string, any>, url = '/protected'): boolean | UrlTree {
    const route = { data: routeData } as unknown as ActivatedRouteSnapshot;
    const state = { url } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => roleGuard(route, state)) as boolean | UrlTree;
  }

  it('should redirect unauthenticated users to /login with returnUrl', () => {
    mockAuthService.isLoggedIn.and.returnValue(false);
    mockAuthService.role.and.returnValue('guest');

    const result = executeGuard({ expectedRoles: ['admin'] }, '/coach/roadmap');

    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toContain('/login');
  });

  it('should permit access when user role matches expectedRoles array', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.role.and.returnValue('moderator');

    const result = executeGuard({ expectedRoles: ['admin', 'moderator'] });

    expect(result).toBeTrue();
  });

  it('should permit access when user role matches single expectedRole string', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.role.and.returnValue('admin');

    const result = executeGuard({ expectedRole: 'admin' });

    expect(result).toBeTrue();
  });

  it('should redirect authenticated users with wrong role to /home', () => {
    mockAuthService.isLoggedIn.and.returnValue(true);
    mockAuthService.role.and.returnValue('user');

    const result = executeGuard({ expectedRoles: ['admin'] }, '/coach/roadmap');

    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toEqual('/home');
  });
});

