import { User } from '@prisma/client';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}

export interface JWTPayload {
  id: number;
  username: string;
  role: string;
}

