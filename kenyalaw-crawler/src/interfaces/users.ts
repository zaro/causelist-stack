export interface ICreateUserDataParams {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
}

export enum UserRole {
  Admin = 'admin',
  Lawyer = 'lawyer',
}

export interface IUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}
