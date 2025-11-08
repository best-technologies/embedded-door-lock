export class User {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  profilePicture?: string;
  authTypes: string[];
  rfidTags: string[];
  fingerprintIds: number[];
  status: 'active' | 'suspended' | 'terminated';
  role: string;
  department?: string;
  lastAccessAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

