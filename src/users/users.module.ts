import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, usersSchema } from 'src/schemas/users.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { imagesSchema } from 'src/schemas/postImages.schema';
import { AuthService } from 'src/auth/auth.service';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';  


@Module({
  imports: [
  MongooseModule.forFeature([{ name: 'User', schema: usersSchema }]),
  MongooseModule.forFeature([{ name: 'Image', schema: imagesSchema }]),
],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService, AuthService]
})
export class UsersModule {}
