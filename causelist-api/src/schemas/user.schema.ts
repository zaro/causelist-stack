import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  Admin = 'admin',
  Lawyer = 'lawyer',
}

@Schema({ timestamps: true })
export class User {
  @Prop({
    get: function () {
      return (this as any)._id.toString();
    },
  })
  id: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  phone: string;

  @Prop()
  email: string;

  @Prop({
    enum: UserRole,
  })
  role: UserRole;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
