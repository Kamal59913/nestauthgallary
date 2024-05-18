import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt'
import { Document } from 'mongoose';

export type UserDocument = User & Document;


@Schema()
export class User {
  @Prop({ unique: true, index: 'text'}) /*index*/
  username: string;

  @Prop()
  fullname: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  @Prop()
  refreshtoken: string;
}

export const usersSchema = SchemaFactory.createForClass(User);

usersSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

