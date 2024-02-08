export interface IUpdateUserDataParams {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ICreateUserDataParams extends IUpdateUserDataParams {
  phone: string;
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

export interface IUserStats {
  totalCount: number;
  countByDay: {
    [key: string]: {
      otpUsedCount: number;
      otpUnusedCount: number;
      totalCount: number;
    };
  };
}

export enum SubscriptionTier {
  TRIAL = 'TRIAL',
  STANDARD = 'STANDARD',
}

export interface ISubscription {
  from: Date;
  to: Date;
  tier: SubscriptionTier;
  paid: number;
  user: IUser;
  createdAt?: Date;
  updatedAt?: Date;
}
