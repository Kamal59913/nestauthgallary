import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(private readonly jwtServ: JwtService) {}
    
    validateToken(token: string) {
        return this.jwtServ.verify(token, {
            secret : process.env.JWT_SECRET
        });
    }
}