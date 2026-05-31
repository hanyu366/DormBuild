export type NotificationType = 'expense' | 'duty' | 'vote' | 'convention' | 'anonymous' | 'weather';

export interface Notification {
  id: string;
  dormId: string;
  userId?: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}
