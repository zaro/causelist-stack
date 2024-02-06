import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { DocumentTypeHint } from '../interfaces/index.js';
import { IInfoFile } from '../interfaces/info-file.js';

export type InfoFileDocument = HydratedDocument<InfoFile>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class InfoFile implements IInfoFile {
  id: string;

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

  @Prop({ type: String })
  overrideDocumentType?: DocumentTypeHint;

  @Prop()
  hasCorrection?: boolean;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const InfoFileSchema = SchemaFactory.createForClass(InfoFile);
InfoFileSchema.virtual('id')
  .get(function (this: InfoFileDocument) {
    return this._id;
  })
  .set(function (this: InfoFileDocument, id: string) {
    this.set({ _id: id });
  });
