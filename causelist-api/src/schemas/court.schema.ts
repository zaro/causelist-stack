import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CourtDocument = HydratedDocument<Court>;

@Schema({ timestamps: true })
export class Court {
  @Prop()
  name: string;

  @Prop()
  type: string;

  @Prop()
  path: string;

  @Prop()
  documentsCount: number;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const CourtSchema = SchemaFactory.createForClass(Court);
