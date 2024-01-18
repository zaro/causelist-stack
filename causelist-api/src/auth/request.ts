import { Request } from 'express';

export interface UserDataInRequest {
  id: string;
  role: string;
}

export type RequestWithUser = Request & {
  user: UserDataInRequest;
};
