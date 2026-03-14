import { Timestamp } from 'firebase/firestore';

export type UserRole = 'exhibitor' | 'visitor';

export interface UserModel {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  fcmToken?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
