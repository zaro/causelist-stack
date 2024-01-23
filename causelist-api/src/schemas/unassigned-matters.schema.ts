import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { InfoFile } from './info-file.schema.js';
import {
  CauseListParsed,
  CauselistHeaderParsed,
  CauselistSectionParsed,
  UnassignedMattersHeaderParsed,
  UnassignedMattersLineParsed,
  UnassignedMattersParsed,
} from '../interfaces/index.js';
import { ParsedDocument } from './causelist.schema.js';

@Schema({ _id: false })
export class UnassignedMattersHeader implements UnassignedMattersHeaderParsed {
  @Prop()
  date: string;
}

@Schema({ _id: false })
export class UnassignedMattersLine implements UnassignedMattersLineParsed {
  @Prop()
  typeOfCause: string;

  @Prop()
  caseNumber: string;

  @Prop()
  num: string;

  @Prop()
  partyA: string;

  @Prop()
  partyB: string;

  @Prop()
  description: string;
}

export type UnassignedMattersDocument = HydratedDocument<UnassignedMatters>;

@Schema({ timestamps: true })
export class UnassignedMatters
  implements ParsedDocument, UnassignedMattersParsed
{
  @Prop({ type: String })
  type: UnassignedMattersParsed['type'];

  @Prop({ type: UnassignedMattersHeader })
  header: UnassignedMattersHeader;

  @Prop({ type: [UnassignedMattersLine] })
  cases: UnassignedMattersLine[];

  @Prop({ required: true, type: 'ObjectId', ref: 'InfoFile' })
  parsedFrom: InfoFile;

  @Prop()
  parentPath: string;
}

export const UnassignedMattersSchema =
  SchemaFactory.createForClass(UnassignedMatters);

UnassignedMattersSchema.index(
  {
    'cases.caseNumber': 'text',
    'cases.additionalNumber': 'text',
    'cases.partyA': 'text',
    'cases.partyB': 'text',
    'cases.description': 'text',
  },
  {
    name: 'search',
  },
);
