import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ImageDocument = Image & Document;

@Schema()
export class Image {
  @Prop()
  images: [{
    width: string;
    height: string;
    format: string;
    resource_type: string;
    created_at: string;
    type: string;
    original_filename: string;
    url: string;
    bytes: string;
  }];

  @Prop({ type: Date, default: Date.now, index: true })
  uploadDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', index: true })
  uploaderId: MongooseSchema.Types.ObjectId;
}

export const imagesSchema = SchemaFactory.createForClass(Image);
