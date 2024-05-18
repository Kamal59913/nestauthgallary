import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ImageDocument = Image & Document;


@Schema()
export class Image {
  @Prop({type: [String]})
  images: string[];

  @Prop({ type: Date, default: Date.now, index: true })
  uploadDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  uploaderId: MongooseSchema.Types.ObjectId;
}

export const imagesSchema = SchemaFactory.createForClass(Image);
