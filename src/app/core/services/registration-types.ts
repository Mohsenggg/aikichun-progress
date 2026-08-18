export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  profession: string;
  branch: string;
  phoneNumber: string;
  phoneNumberEmergency: string;
  hasChronicConditionOrInjury: boolean;
  medicalNotes?: string;
  subscriptionStartMonth: string;
  subscriptionStartYear: string;
  profilePhoto?: File;
  idPhoto?: File;
}
