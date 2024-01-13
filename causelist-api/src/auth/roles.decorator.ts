import { Reflector } from '@nestjs/core';
import { UserRole } from '../interfaces/users.js';
export const Roles = Reflector.createDecorator<UserRole[]>();
