import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { InfoFile } from './info-file.schema.js';
import { CauselistHeaderParsed } from '../interfaces/index.js';

@Schema({ _id: false })
export class CauseListHeader implements CauselistHeaderParsed {
  @Prop()
  court: string[];

  @Prop()
  date: string;

  @Prop()
  judge: string;

  @Prop()
  courtRoom: string;

  @Prop()
  url: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;
}

@Schema({ _id: false })
export class CauseListLine {
  @Prop()
  caseNumber: string;

  @Prop()
  num: string;

  @Prop()
  additionalNumber?: string;

  @Prop()
  partyA: string;

  @Prop()
  partyB: string;

  @Prop()
  description: string;
}

@Schema({ _id: false })
export class CauseListSection {
  @Prop()
  dateTime: Date;

  @Prop()
  typeOfCause: string;

  @Prop({ type: [CauseListLine] })
  cases: CauseListLine[];
}

export type CauseListDocument = HydratedDocument<CauseList>;
@Schema({ timestamps: true })
export class CauseList {
  @Prop()
  type: string;

  @Prop({ type: CauseListHeader })
  header: CauseListHeader;

  @Prop({ type: [CauseListSection] })
  causeLists: CauseListSection[];

  @Prop({ type: 'ObjectId', ref: () => InfoFile })
  parsedFrom: InfoFile;
}

export const CauseListSchema = SchemaFactory.createForClass(CauseList);
