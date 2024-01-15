import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InfoFileDocument = HydratedDocument<InfoFile>;

@Schema({ timestamps: true })
export class InfoFile {
  @Prop()
  fileName: string;

  @Prop()
  fileUrl: string;

  @Prop()
  sha1: string;

  @Prop()
  mimeType: string;

  @Prop()
  fullyParsed: boolean;

  @Prop()
  parseError: boolean;

  @Prop()
  parentUrl: string;

  @Prop()
  parentPath: string;

  @Prop()
  parentName: string;

  @Prop()
  parsedAt?: Date;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const InfoFileSchema = SchemaFactory.createForClass(InfoFile);
