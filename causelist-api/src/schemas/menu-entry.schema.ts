import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MenuEntryDocument = HydratedDocument<MenuEntry>;

@Schema({ timestamps: true })
export class MenuEntry {
  @Prop()
  name: string;

  @Prop()
  url: string;

  @Prop()
  path: string;

  @Prop({ type: [{ type: 'ObjectId', ref: 'MenuEntry' }], default: [] })
  children: MenuEntry[];

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const MenuEntrySchema = SchemaFactory.createForClass(MenuEntry);

MenuEntrySchema.pre('find', function () {
  this.populate('children');
});

MenuEntrySchema.pre('findOne', function () {
  this.populate('children');
});
