import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DirectoryListingDocument = HydratedDocument<DirectoryListing>;

@Schema({ timestamps: true })
export class DirectoryListing {
  @Prop()
  name: string;

  @Prop()
  city: string;

  @Prop({ index: 1 })
  county: string;
}

export const DirectoryListingSchema =
  SchemaFactory.createForClass(DirectoryListing);
