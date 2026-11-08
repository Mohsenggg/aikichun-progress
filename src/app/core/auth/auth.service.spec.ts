import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    localStorage.clear();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should initialize as guest when no session stored', () => {
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.role()).toEqual('guest');
    expect(service.isAdmin()).toBeFalse();
    expect(service.isModerator()).toBeFalse();
    expect(service.isTrainee()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('should map ADMIN role correctly and update signals', () => {
    const mockResponse: AuthResponse = {
      token: 'admin-jwt-token',
      tokenType: 'Bearer',
      expiresAt: '2026-12-31T23:59:59',
      user: {
        id: '469c0293-d2da-4dc2-9c14-bc7e6e1e99a7',
        email: 'admin@aikichun.com',
        fullName: 'Admin User',
        role: 'ADMIN',
        accountStatus: 'ACTIVE'
      }
    };

    service.setSession(mockResponse);

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.role()).toEqual('admin');
    expect(service.isAdmin()).toBeTrue();
    expect(service.isModerator()).toBeFalse();
    expect(service.isTrainee()).toBeFalse();
    expect(service.accountStatus()).toEqual('ACTIVE');
    expect(service.currentUserUUID()).toEqual('469c0293-d2da-4dc2-9c14-bc7e6e1e99a7');
    expect(localStorage.getItem('aikichun_token')).toEqual('admin-jwt-token');
  });

  it('should map MODERATOR role correctly', () => {
    const mockResponse: AuthResponse = {
      token: 'mod-jwt-token',
      tokenType: 'Bearer',
      expiresAt: '2026-12-31T23:59:59',
      user: {
        id: 'aec4365f-ca1c-446a-8294-30bcf7439425',
        email: 'moderator@aikichun.com',
        fullName: 'Moderator User',
        role: 'MODERATOR',
        accountStatus: 'ACTIVE'
      }
    };

    service.setSession(mockResponse);

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.role()).toEqual('moderator');
    expect(service.isAdmin()).toBeFalse();
    expect(service.isModerator()).toBeTrue();
    expect(service.isTrainee()).toBeFalse();
  });

  it('should map MEMBER role to user correctly', () => {
    const mockResponse: AuthResponse = {
      token: 'trainee-jwt-token',
      tokenType: 'Bearer',
      expiresAt: '2026-12-31T23:59:59',
      user: {
        id: '1b6d617d-c473-4d2f-8348-a906b9a0c8b0',
        email: 'trainee@aikichun.com',
        fullName: 'Trainee User',
        role: 'MEMBER',
        accountStatus: 'ACTIVE'
      }
    };

    service.setSession(mockResponse);

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.role()).toEqual('user');
    expect(service.isAdmin()).toBeFalse();
    expect(service.isModerator()).toBeFalse();
    expect(service.isTrainee()).toBeTrue();
  });

  it('should clear session and navigate to login on logout', async () => {
    const mockResponse: AuthResponse = {
      token: 'token-to-clear',
      tokenType: 'Bearer',
      expiresAt: '2026-12-31T23:59:59',
      user: {
        id: '1b6d617d-c473-4d2f-8348-a906b9a0c8b0',
        email: 'trainee@aikichun.com',
        fullName: 'Trainee User',
        role: 'MEMBER',
        accountStatus: 'ACTIVE'
      }
    };

    service.setSession(mockResponse);
    expect(service.isLoggedIn()).toBeTrue();

    const logoutPromise = service.logout();
    const req = httpMock.expectOne('http://localhost:8080/api/v1/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({});

    await logoutPromise;

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.role()).toEqual('guest');
    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('aikichun_token')).toBeNull();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});

