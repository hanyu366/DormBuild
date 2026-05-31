export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  dormId: string;
  createdAt: string;
}

export interface Dorm {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  members: User[];
}

export interface DutySchedule {
  id: string;
  dormId: string;
  userId: string;
  dutyDate: string;
  dutyType: string;
  completed: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export * from './expense';
export * from './convention';
export * from './vote';
export * from './message';
export * from './notification';
export * from './weather';
