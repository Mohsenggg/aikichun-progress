export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface PublicUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accountStatus: AccountStatus;
}

export interface AuthResponse {
  user: PublicUserDto;
  token: string;
  tokenType: string;
  expiresAt: string;
}

export interface SendOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}
