import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config'; /*env variable*/
import { JwtModule } from '@nestjs/jwt'; /*jwt authentication*/
import { MulterModule } from '@nestjs/platform-express'; /*multer middleware*/
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRoot(`${process.env.MONGO_URI}`,{dbName: 'img_gallary'}),
    UsersModule,
    JwtModule.register({      
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },}),
    MulterModule.register({
      dest: './public'
    }),
    AuthModule
    ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
