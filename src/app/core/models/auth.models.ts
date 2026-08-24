export type AccountStatus = 'PENDING_VERIFICATION' | 'ACTIVE' | 'SUSPENDED' | 'BANNED';

export interface PublicUserDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  accountStatus: AccountStatus;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: string;
  profession: string;
  branch: string;
  phoneNumber: string;
  phoneNumberEmergency: string;
  servicesOrExperience: string;
  productsAndDiscounts: string;
  martialArtsExperience: string;
  hasChronicConditionOrInjury: boolean;
  medicalNotes: string;
  subscriptionStartMonth: number;
  subscriptionStartYear: number;
  role: string;
  profilePhotoPath: string;
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
