// User entity - database integration coming in next Phase 2 commit
export class User {
  id: number;
  googleId: string;
  email: string;
  name: string;
  picture?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
