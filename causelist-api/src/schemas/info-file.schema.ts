import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type InfoFileDocument = HydratedDocument<InfoFile>;

@Schema({ timestamps: true })
export class InfoFile {
  @Prop()
  fileName: string;

  @Prop()
  md5: string;

  @Prop()
  mimeType: string;

  @Prop()
  textContent: string;

  @Prop()
  textContentType: string;

  @Prop()
  textContentMd5: string;

  @Prop()
  error: string;

  @Prop()
  parentUrl: string;

  @Prop()
  parentName: string;

  @Prop()
  parentPath: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const InfoFileSchema = SchemaFactory.createForClass(InfoFile);
