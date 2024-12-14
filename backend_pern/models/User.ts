export interface User {
  id: number;
  email: string;
  password: string;
  otp: string | null;
  otpExpiry: Date | null;
}