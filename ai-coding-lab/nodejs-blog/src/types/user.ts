export type Role = 'admin' | 'author' | 'reader';

export interface User {
  id: number;
  email: string;
  nickname: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string;
}

export interface SessionUser {
  id: number;
  email: string;
  nickname: string;
  role: Role;
}

export interface UserListItem {
  id: number;
  email: string;
  nickname: string;
  role: Role;
  createdAt: string;
  lastLoginAt: string;
}
