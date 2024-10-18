export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  id: number;
  first_name: string;
  email: string;
  phone_number: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export type UserResponse = {
  id: number;
  first_name: string;
  email: string;
  phone_number?: string;
};
