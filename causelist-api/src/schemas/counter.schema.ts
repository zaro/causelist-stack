import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

export type CounterDocument = HydratedDocument<Counter>;

@Schema()
export class Counter {
  @Prop()
  _id: string;

  @Prop()
  seq: number;
}

export interface CounterWithStatics extends Model<Counter> {
  next(name: string): number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);

CounterSchema.statics.next = async function (name: string) {
  if (!name) {
    throw new Error('Counter.next() must provide a name!');
  }
  const r = await this.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return r.seq;
};
