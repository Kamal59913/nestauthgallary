import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; /*env variable*/
import { JwtModule } from '@nestjs/jwt'; /*jwt authentication*/
import { MulterModule } from '@nestjs/platform-express'; /*multer middleware*/
import { AuthModule } from './auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';  


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
    }),
    MulterModule.register({
      dest: './public'
    }),
    AuthModule,
    CacheModule.register({  
      isGlobal: true,  
      useFactory: async ( configService: ConfigService) => ({  
        store: await redisStore({  
          socket: {  
            host: 'localhost',  
            port: 6379,  
          }, 
        }),     
      }),    
    }),    
    ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
