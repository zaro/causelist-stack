import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InviteCodeDocument = HydratedDocument<InviteCode>;

@Schema({ timestamps: true })
export class InviteCode {
  @Prop()
  code: string;

  @Prop()
  enabled: boolean;
}

export const InviteCodeSchema = SchemaFactory.createForClass(InviteCode);
