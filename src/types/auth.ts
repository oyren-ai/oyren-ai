export interface User {
  userId: string;
  email: string;
  name: string;
  image?: string;
}

export interface JwtPayload {
  sub?: string;
  userId?: string;
  email: string;
  name: string;
  image?: string;
  picture?: string;
  exp?: number;
}