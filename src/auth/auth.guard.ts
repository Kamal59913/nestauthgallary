import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, 
    ForbiddenException,} from '@nestjs/common';
    import { AuthService } from './auth.service';
import { InjectModel } from '@nestjs/mongoose';
import { User } from 'src/schemas/users.schema';
import { Model } from 'mongoose';
  
      @Injectable()
      export class AuthGuard implements CanActivate {
        constructor(private readonly authService: AuthService,
        @InjectModel('User') private userModel: Model<User>) {}
      
        async canActivate(context: ExecutionContext): Promise<boolean> {
          try {
            const request = context.switchToHttp().getRequest();
            const token = request.cookies?.token || request.header("Authorization")?.replace("Bearer", "");
            console.log("token", token)
            if (!token) {
              throw new UnauthorizedException('Please provide token');
            }
            const resp = await this.authService.validateToken(token);
            const userId = resp.id
            const findUser = await this.userModel.findById(userId).select("-password").exec()

            request.user = findUser;
            return true;
          } catch (error) {
            console.log('auth error', error.message);
          }
        }
      }